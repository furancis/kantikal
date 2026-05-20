import { describe, expect, it } from 'vitest'
import {
  createSunoApiServerAdapter,
  normalizeProviderCallback,
  normalizeProviderRecordInfo,
} from './sunoApiAdapter'

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

  it('does not dispatch inbound provider callbacks to the external provider API', async () => {
    let fetchCalls = 0
    const adapter = createSunoApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      fetchImpl: async () => {
        fetchCalls += 1
        throw new Error('inbound handlers must not fetch')
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'handleProviderCallback',
      capability: 'Webhooks/retries',
      payload: { providerTaskId: 'task_123' },
    })

    expect(fetchCalls).toBe(0)
    expect(result).toMatchObject({
      action: 'handleProviderCallback',
      outcome: 'blocked',
      authBoundary: 'server',
      endpoint: '/api/provider/callback',
    })
  })

  it('does not dispatch parameter-only actions as standalone provider calls', async () => {
    let fetchCalls = 0
    const adapter = createSunoApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      fetchImpl: async () => {
        fetchCalls += 1
        throw new Error('parameter-only actions must not fetch')
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'selectModelVersion',
      capability: 'Model/version selection',
      payload: { model: 'suno-v4' },
    })

    expect(fetchCalls).toBe(0)
    expect(result).toMatchObject({
      action: 'selectModelVersion',
      outcome: 'planned',
      authBoundary: 'server',
      endpoint: '/api/v1/generate',
    })
  })

  it('normalizes music record-info results into workflow task-update outputs', () => {
    const update = normalizeProviderRecordInfo(
      {
        code: 200,
        msg: 'success',
        data: {
          taskId: 'task_123',
          status: 'SUCCESS',
          response: {
            sunoData: [
              {
                id: 'song_a',
                title: 'Night Lift A',
                audioUrl: 'https://cdn.example/song-a.mp3',
                imageUrl: 'https://cdn.example/song-a.jpeg',
              },
            ],
          },
        },
      },
      {
        action: 'pollGenerationStatus',
        capability: 'Get music generation details',
        receiptId: 'poll-task-123',
      },
    )

    expect(update).toEqual({
      providerTaskId: 'task_123',
      action: 'pollGenerationStatus',
      capability: 'Get music generation details',
      providerStatus: 'SUCCESS',
      message: 'success',
      receiptId: 'poll-task-123',
      outputs: [
        {
          kind: 'audio',
          label: 'Night Lift A audio',
          url: 'https://cdn.example/song-a.mp3',
          sourceTrackId: 'song_a',
        },
        {
          kind: 'cover-art',
          label: 'Night Lift A cover art',
          url: 'https://cdn.example/song-a.jpeg',
          sourceTrackId: 'song_a',
        },
      ],
    })
  })

  it('normalizes provider callbacks into acknowledged workflow callback receipts', () => {
    const callback = normalizeProviderCallback(
      {
        code: 200,
        msg: 'All generated successfully.',
        data: {
          callbackType: 'complete',
          task_id: 'task_456',
          data: [
            {
              id: 'song_b',
              title: 'Night Lift B',
              audio_url: 'https://cdn.example/song-b.mp3',
              image_url: 'https://cdn.example/song-b.jpeg',
            },
          ],
        },
      },
      {
        action: 'handleProviderCallback',
        capability: 'Webhooks/retries',
        receiptId: 'callback-task-456',
      },
    )

    expect(callback).toMatchObject({
      providerTaskId: 'task_456',
      callbackType: 'complete',
      code: 200,
      message: 'All generated successfully.',
      outputs: [
        {
          kind: 'audio',
          label: 'Night Lift B audio',
          url: 'https://cdn.example/song-b.mp3',
          sourceTrackId: 'song_b',
        },
        {
          kind: 'cover-art',
          label: 'Night Lift B cover art',
          url: 'https://cdn.example/song-b.jpeg',
          sourceTrackId: 'song_b',
        },
      ],
    })
  })
})
