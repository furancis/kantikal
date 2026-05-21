import { describe, expect, it } from 'vitest'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createMockSunoProvider } from '../src/api/provider'
import {
  createProviderNodeMiddleware,
  createProviderRequestHandler,
  createServerSunoProvider,
} from './providerRoutes'
import { createSunoApiServerAdapter } from './sunoApiAdapter'

describe('provider request routes', () => {
  it('generates batches through the HTTP route without exposing server credentials', async () => {
    const route = createProviderRequestHandler({
      provider: createServerSunoProvider({
        adapter: createSunoApiServerAdapter({
          runtime: 'server',
          apiKey: 'server-secret',
          callbackUrl: 'http://local.test/api/provider-exports/project-a/callback',
          fetchImpl: async () =>
            new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_http_generate' } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
        }),
      }),
    })

    const response = await route(
      new Request('http://local.test/api/provider/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            brief: 'HTTP route hook',
            lyrics: 'Verse chorus',
            style: 'cinematic pop',
            voice: 'consented lead',
            count: 2,
          },
        }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.batch).toMatchObject({
      providerJobId: 'task_http_generate',
      tracks: [
        { id: 'task_http_generate-track-1', title: 'HTTP route hook provider take 1' },
        { id: 'task_http_generate-track-2', title: 'HTTP route hook provider take 2' },
      ],
    })
    expect(JSON.stringify(payload)).not.toContain('server-secret')
  })

  it('keeps taste-lock directives out of provider display titles', async () => {
    const route = createProviderRequestHandler({
      provider: createServerSunoProvider({
        adapter: createSunoApiServerAdapter({
          runtime: 'server',
          apiKey: 'server-secret',
          callbackUrl: 'http://local.test/api/provider-exports/project-a/callback',
          fetchImpl: async () =>
            new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_http_generate' } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
        }),
      }),
    })

    const response = await route(
      new Request('http://local.test/api/provider/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            brief: 'HTTP route hook\nTaste lock: match liked track',
            lyrics: 'Verse chorus',
            style: 'cinematic pop',
            voice: 'consented lead',
            count: 1,
          },
        }),
      }),
    )
    const payload = await response.json()

    expect(payload.batch.tracks[0].title).toBe('HTTP route hook provider take 1')
  })

  it('dispatches provider actions through the HTTP route without returning the key', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const route = createProviderRequestHandler({
      provider: createServerSunoProvider({
        adapter: createSunoApiServerAdapter({
          runtime: 'server',
          apiKey: 'server-secret',
          callbackUrl: 'http://local.test/api/provider-exports/project-a/callback',
          fetchImpl: async (url, init) => {
            calls.push({ url: String(url), init: init ?? {} })
            return new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_lyrics' } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          },
        }),
      }),
    })

    const response = await route(
      new Request('http://local.test/api/provider/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            action: 'generateLyrics',
            capability: 'Lyrics generation',
            payload: { prompt: 'hook' },
          },
        }),
      }),
    )
    const payload = await response.json()

    expect(calls).toHaveLength(1)
    expect(calls[0].init.headers).toMatchObject({
      Authorization: 'Bearer server-secret',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      prompt: 'hook',
      callBackUrl: 'http://local.test/api/provider-exports/project-a/callback',
    })
    expect(response.status).toBe(200)
    expect(payload.result).toMatchObject({
      action: 'generateLyrics',
      outcome: 'succeeded',
      providerTaskId: 'task_lyrics',
    })
    expect(JSON.stringify(payload)).not.toContain('server-secret')
  })

  it('returns a JSON route error instead of falling through for malformed provider payloads', async () => {
    const route = createProviderRequestHandler({
      provider: createMockSunoProvider(),
    })

    const response = await route(
      new Request('http://local.test/api/provider/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: null }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/requires provider action request/i)
  })

  it('rejects cross-origin browser posts before provider execution', async () => {
    const route = createProviderRequestHandler({
      provider: createMockSunoProvider(),
    })

    const response = await route(
      new Request('http://local.test/api/provider/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example',
        },
        body: JSON.stringify({
          request: {
            action: 'generateLyrics',
            capability: 'Lyrics generation',
            payload: { prompt: 'hook' },
          },
        }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.error).toMatch(/local browser origin/i)
  })

  it('rejects malformed generation requests before provider execution', async () => {
    const route = createProviderRequestHandler({
      provider: createMockSunoProvider(),
    })

    const response = await route(
      new Request('http://local.test/api/provider/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: { count: 'two' } }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/brief/i)
  })

  it('rejects malformed provider action requests before provider execution', async () => {
    const route = createProviderRequestHandler({
      provider: createMockSunoProvider(),
    })

    const response = await route(
      new Request('http://local.test/api/provider/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: { capability: 123 } }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/action/i)
  })

  it('does not intercept provider export routes mounted beside the provider API', async () => {
    const middleware = createProviderNodeMiddleware({ provider: createMockSunoProvider() })
    const request = Readable.from([]) as IncomingMessage
    request.url = '/api/provider-exports/project-a/poll-generation-task'
    request.method = 'POST'
    request.headers = {}
    const response = {} as ServerResponse
    let nextCalled = false

    await middleware(request, response, () => {
      nextCalled = true
    })

    expect(nextCalled).toBe(true)
  })
})
