import { describe, expect, it } from 'vitest'
import { createSunoApiServerAdapter } from './sunoApiAdapter'

describe('server Suno API adapter', () => {
  it('refuses to construct with client runtime so secrets cannot move into the browser lane', () => {
    expect(() =>
      createSunoApiServerAdapter({
        runtime: 'client',
        apiKey: 'server-secret',
      }),
    ).toThrow(/server-side/i)
  })

  it('blocks real server actions without an API key and does not call fetch', async () => {
    let fetchCalls = 0
    const adapter = createSunoApiServerAdapter({
      runtime: 'server',
      fetchImpl: async () => {
        fetchCalls += 1
        return new Response('{}')
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'generateLyrics',
      capability: 'Lyrics generation',
      payload: { prompt: 'hook' },
    })

    expect(fetchCalls).toBe(0)
    expect(result).toMatchObject({
      action: 'generateLyrics',
      outcome: 'blocked',
      authBoundary: 'server',
    })
  })

  it('sends endpoint-backed actions through an authorization-bearing server fetch without returning the key', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const adapter = createSunoApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.sunoapi.org',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(
          JSON.stringify({
            code: 200,
            msg: 'success',
            data: { taskId: 'task_123' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'generateLyrics',
      capability: 'Lyrics generation',
      payload: { prompt: 'hook', callBackUrl: 'https://example.com/callback' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.sunoapi.org/api/v1/lyrics')
    expect(calls[0].init.method).toBe('POST')
    expect(calls[0].init.headers).toMatchObject({
      Authorization: 'Bearer server-secret',
      'Content-Type': 'application/json',
    })
    expect(result).toMatchObject({
      action: 'generateLyrics',
      outcome: 'succeeded',
      endpoint: '/api/v1/lyrics',
      providerTaskId: 'task_123',
    })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })

  it('keeps unsupported provider actions as explicit non-network outcomes', async () => {
    const adapter = createSunoApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      fetchImpl: async () => {
        throw new Error('unsupported actions must not fetch')
      },
    })

    await expect(
      adapter.executeProviderAction({
        action: 'listLibrary',
        capability: 'Library list/search',
      }),
    ).resolves.toMatchObject({
      outcome: 'unsupported',
      action: 'listLibrary',
    })
  })
})
