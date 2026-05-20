import { describe, expect, it } from 'vitest'
import {
  createFetchSunoProvider,
  createMockSunoProvider,
  createProviderRuntimeConfig,
  publicProviderStatus,
} from './provider'

describe('Suno provider boundary', () => {
  it('keeps provider credentials on the server side', () => {
    expect(() =>
      createProviderRuntimeConfig({
        runtime: 'client',
        apiKey: 'secret-key',
      }),
    ).toThrow(/server-side/i)

    expect(
      createProviderRuntimeConfig({
        runtime: 'server',
        apiKey: 'secret-key',
        baseUrl: 'https://api.sunoapi.org',
      }),
    ).toMatchObject({
      runtime: 'server',
      baseUrl: 'https://api.sunoapi.org',
      hasApiKey: true,
      credentialMode: 'server-injected',
    })
  })

  it('exposes only redacted provider state to the client', () => {
    const status = publicProviderStatus(
      createProviderRuntimeConfig({
        runtime: 'server',
        apiKey: 'secret-key',
        baseUrl: 'https://api.sunoapi.org',
      }),
    )

    expect(status).toEqual({
      provider: 'suno-compatible',
      baseUrl: 'https://api.sunoapi.org',
      hasApiKey: true,
      credentialMode: 'server-injected',
    })
    expect(JSON.stringify(status)).not.toContain('secret-key')
  })

  it('generates deterministic mocked batches without real credentials', async () => {
    const provider = createMockSunoProvider()

    const batch = await provider.generateBatch({
      brief: 'cinematic Arabic club-pop',
      lyrics: 'hook line',
      style: 'electro-pop',
      voice: 'consented persona',
      count: 2,
    })

    expect(batch.providerJobId).toMatch(/^mock_suno_/)
    expect(batch.tracks).toHaveLength(2)
    expect(batch.tracks[0]).toMatchObject({
      id: 'mock-track-1',
      title: 'cinematic Arabic club-pop v1',
    })
  })

  it('uses HTTP provider routes when they are mounted', async () => {
    const calls: Array<{ url: string; body: string }> = []
    const provider = createFetchSunoProvider({
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), body: String(init?.body ?? '') })
        return new Response(
          JSON.stringify({
            batch: {
              providerJobId: 'task_http_generate',
              tracks: [{ id: 'http-track-1', title: 'HTTP route hook v1', durationSeconds: 154 }],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })

    const batch = await provider.generateBatch({
      brief: 'HTTP route hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      voice: 'consented lead',
      count: 1,
    })

    expect(calls[0].url).toBe('/api/provider/generate-batch')
    expect(JSON.parse(calls[0].body)).toMatchObject({ request: { brief: 'HTTP route hook', count: 1 } })
    expect(batch.providerJobId).toBe('task_http_generate')
  })

  it('falls back to the mock provider when the HTTP provider route is absent', async () => {
    const provider = createFetchSunoProvider({
      fetchImpl: async () => new Response(JSON.stringify({ error: 'not found' }), { status: 404 }),
    })

    const batch = await provider.generateBatch({
      brief: 'Fallback hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      voice: 'consented lead',
      count: 2,
    })

    expect(batch.providerJobId).toMatch(/^mock_suno_/)
    expect(batch.tracks).toHaveLength(2)
  })

  it('surfaces unreachable provider routes instead of hiding them behind fallback', async () => {
    const provider = createFetchSunoProvider({
      fetchImpl: async () => {
        throw new TypeError('connection refused')
      },
    })

    await expect(
      provider.generateBatch({
        brief: 'Unreachable route hook',
        lyrics: 'Verse chorus',
        style: 'cinematic pop',
        voice: 'consented lead',
        count: 2,
      }),
    ).rejects.toThrow(/provider route unavailable/i)
  })

  it('surfaces mounted provider route failures instead of hiding them behind fallback', async () => {
    const provider = createFetchSunoProvider({
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'Server provider route failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(
      provider.generateBatch({
        brief: 'Failure hook',
        lyrics: 'Verse chorus',
        style: 'cinematic pop',
        voice: 'consented lead',
        count: 2,
      }),
    ).rejects.toThrow(/server provider route failed/i)
  })

  it('dispatches API actions through the HTTP provider route', async () => {
    const provider = createFetchSunoProvider({
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            result: {
              action: 'generateLyrics',
              capability: 'Lyrics generation',
              outcome: 'succeeded',
              message: 'Lyrics generation dispatched through HTTP provider route.',
              authBoundary: 'server',
              endpoint: '/api/v1/lyrics',
              providerTaskId: 'task_lyrics',
              receiptId: 'server-action-generateLyrics',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    })

    await expect(
      provider.executeAction?.({
        action: 'generateLyrics',
        capability: 'Lyrics generation',
        payload: { prompt: 'hook' },
      }),
    ).resolves.toMatchObject({
      action: 'generateLyrics',
      outcome: 'succeeded',
      providerTaskId: 'task_lyrics',
    })
  })
})
