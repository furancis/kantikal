import { describe, expect, it } from 'vitest'
import {
  createMusicApiServerAdapter,
  normalizeProviderCallback,
  normalizeProviderRecordInfo,
} from './musicApiAdapter'

describe('server compatible-provider provider adapter', () => {
  it('refuses to construct with client runtime so secrets cannot move into the browser lane', () => {
    expect(() =>
      createMusicApiServerAdapter({
        runtime: 'client',
        apiKey: 'server-secret',
      }),
    ).toThrow(/server-side/i)
  })

  it('blocks real server actions without an API key and does not call fetch', async () => {
    let fetchCalls = 0
    const adapter = createMusicApiServerAdapter({
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
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
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
    expect(calls[0].url).toBe('https://api.providerapi.org/api/v1/lyrics')
    expect(calls[0].init.method).toBe('POST')
    expect(calls[0].init.headers).toMatchObject({
      Authorization: 'Bearer server-secret',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      prompt: 'hook',
      callBackUrl: 'https://example.com/callback',
    })
    expect(result).toMatchObject({
      action: 'generateLyrics',
      outcome: 'succeeded',
      endpoint: '/api/v1/lyrics',
      providerTaskId: 'task_123',
    })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })

  it('blocks endpoint-backed actions when a provider body rejects auth under HTTP 200', async () => {
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      fetchImpl: async () =>
        new Response(JSON.stringify({ code: 401, msg: 'Unauthorized' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    const result = await adapter.executeProviderAction({
      action: 'generateLyrics',
      capability: 'Lyrics generation',
      payload: { prompt: 'hook', callBackUrl: 'https://example.com/callback' },
    })

    expect(result).toMatchObject({
      action: 'generateLyrics',
      outcome: 'blocked',
      endpoint: '/api/v1/lyrics',
      message: 'Lyrics generation provider request failed with HTTP 200 and provider code 401.',
    })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })

  it('builds required callback payloads from server defaults before dispatch', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      callbackUrl: 'http://local.test/api/provider/callback',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(JSON.stringify({ code: 200, msg: 'success', data: { task_id: 'task_default' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'generateLyrics',
      capability: 'Lyrics generation',
      payload: { prompt: 'hook' },
    })

    expect(calls).toHaveLength(1)
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      prompt: 'hook',
      callBackUrl: 'http://local.test/api/provider/callback',
    })
    expect(result).toMatchObject({
      outcome: 'succeeded',
      providerTaskId: 'task_default',
    })
  })

  it('uses a selected track audio URL as the upload-cover source for cover actions', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      callbackUrl: 'http://local.test/api/provider/callback',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_cover' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'coverTrack',
      capability: 'Cover',
      brief: 'Cover selected hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      payload: { audioUrl: 'https://cdn.example/song-a.mp3' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.providerapi.org/api/v1/generate/upload-cover')
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      uploadUrl: 'https://cdn.example/song-a.mp3',
      callBackUrl: 'http://local.test/api/provider/callback',
    })
    expect(result).toMatchObject({
      action: 'coverTrack',
      outcome: 'succeeded',
      providerTaskId: 'task_cover',
    })
  })

  it('sends the documented snake_case voice availability task field', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(JSON.stringify({ code: 200, msg: 'success', data: { isAvailable: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'checkVoiceAvailability',
      capability: 'Custom voice availability',
      payload: { taskId: 'task_voice_current' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.providerapi.org/api/v1/voice/check-voice')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      task_id: 'task_voice_current',
    })
    expect(result).toMatchObject({
      action: 'checkVoiceAvailability',
      outcome: 'succeeded',
    })
  })

  it('sends the documented voice-regenerate callback spelling while accepting normal callback aliases', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_voice_next' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'regenerateVoiceValidationPhrase',
      capability: 'Voice validation phrase regeneration',
      payload: {
        taskId: 'task_voice_current',
        callBackUrl: 'https://example.com/voice-regenerate',
      },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.providerapi.org/api/v1/voice/regenerate')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      taskId: 'task_voice_current',
      calBackUrl: 'https://example.com/voice-regenerate',
    })
    expect(result).toMatchObject({
      action: 'regenerateVoiceValidationPhrase',
      outcome: 'succeeded',
      providerTaskId: 'task_voice_next',
    })
  })

  it('blocks endpoint-backed actions before fetch when required provider fields are missing', async () => {
    let fetchCalls = 0
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      fetchImpl: async () => {
        fetchCalls += 1
        return new Response('{}')
      },
    })

    const result = await adapter.executeProviderAction({
      action: 'uploadFileUrl',
      capability: 'URL file upload',
      payload: {},
    })

    expect(fetchCalls).toBe(0)
    expect(result).toMatchObject({
      action: 'uploadFileUrl',
      outcome: 'blocked',
      endpoint: '/api/file-url-upload',
    })
    expect(result.message).toMatch(/fileUrl/i)
  })

  it('keeps unsupported provider actions as explicit non-network outcomes', async () => {
    const adapter = createMusicApiServerAdapter({
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
    const adapter = createMusicApiServerAdapter({
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
      outcome: 'succeeded',
      authBoundary: 'server',
      endpoint: '/api/provider/callback',
    })
  })

  it('does not dispatch parameter-only actions as standalone provider calls', async () => {
    let fetchCalls = 0
    const adapter = createMusicApiServerAdapter({
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
      payload: { model: 'provider-v4' },
    })

    expect(fetchCalls).toBe(0)
    expect(result).toMatchObject({
      action: 'selectModelVersion',
      outcome: 'succeeded',
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
            providerData: [
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
