import { describe, expect, it } from 'vitest'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  createWorkflow,
  evaluateLipsync,
  openMusicVideoLane,
  selectTrack,
  submitGenerationBatch,
  type SunoWorkflow,
} from '../src/domain/workflow'
import { createLipsyncEvaluatorEvidence, passingLipsyncChecks } from '../src/test/lipsyncEvidence'
import { createMemoryProviderExportStore, createProviderExportHandlers } from './providerExportHandlers'
import { createProviderExportRequestHandler } from './providerExportRoutes'
import { createProviderExportNodeMiddleware } from './providerExportRoutes'
import { createSunoApiServerAdapter } from './sunoApiAdapter'

function createProjectWorkflow(): SunoWorkflow {
  return selectTrack(
    submitGenerationBatch(
      createWorkflow({
        brief: 'HTTP route hook',
        lyrics: 'Verse chorus',
        style: 'cinematic pop',
        voice: 'consented lead',
      }),
      {
        providerJobId: 'task_http',
        tracks: [{ id: 'song_http', title: 'HTTP Route Song', durationSeconds: 154 }],
      },
    ),
    'song_http',
  )
}

describe('provider export request routes', () => {
  it('polls and hydrates provider export state through Request and Response handlers', async () => {
    const handlers = createProviderExportHandlers({
      adapter: createSunoApiServerAdapter({
        runtime: 'server',
        apiKey: 'server-secret',
        baseUrl: 'https://api.sunoapi.org',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              code: 200,
              msg: 'HTTP provider export route produced local downloadable outputs',
              data: {
                taskId: 'task_http',
                status: 'SUCCESS',
                response: {
                  sunoData: [
                    {
                      id: 'song_http',
                      title: 'HTTP Route Song',
                      audioUrl: 'https://cdn.example/song.mp3',
                      imageUrl: 'https://cdn.example/song.jpeg',
                      vocal_url: 'https://cdn.example/vocals.mp3',
                    },
                  ],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      }),
      store: createMemoryProviderExportStore(),
    })
    const route = createProviderExportRequestHandler(handlers)

    const pollResponse = await route(
      new Request('http://local.test/api/provider-exports/project-a/poll-generation-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: createProjectWorkflow() }),
      }),
    )
    const pollPayload = await pollResponse.json()

    expect(pollResponse.status).toBe(200)
    expect(pollPayload.state.exports.tasks[0]).toMatchObject({
      providerTaskId: 'task_http',
      status: 'ready',
      message: 'HTTP provider export route produced local downloadable outputs',
    })
    expect(pollPayload.state.exports.downloads.map((download: { kind: string }) => download.kind)).toEqual([
      'audio',
      'cover-art',
      'stem',
    ])
    expect(JSON.stringify(pollPayload)).not.toContain('server-secret')

    const hydrateResponse = await route(new Request('http://local.test/api/provider-exports/project-a'))
    const hydratePayload = await hydrateResponse.json()

    expect(hydrateResponse.status).toBe(200)
    expect(hydratePayload.state.exports.tasks[0].providerTaskId).toBe('task_http')
  })

  it('accepts callback and video-output route posts without exposing credential material', async () => {
    const handlers = createProviderExportHandlers({
      adapter: createSunoApiServerAdapter({ runtime: 'server', apiKey: 'server-secret' }),
      store: createMemoryProviderExportStore(),
    })
    const route = createProviderExportRequestHandler(handlers)
    const workflow = createProjectWorkflow()
    const callbackResponse = await route(
      new Request('http://local.test/api/provider-exports/project-a/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow,
          body: {
            code: 200,
            msg: 'Callback received through HTTP route',
            data: {
              callbackType: 'complete',
              task_id: 'task_http',
              data: [{ id: 'song_http', title: 'HTTP Route Song', audio_url: 'https://cdn.example/song.mp3' }],
            },
          },
        }),
      }),
    )
    const blockedVideoWorkflow = openMusicVideoLane(workflow)
    const blockedVideoResponse = await route(
      new Request('http://local.test/api/provider-exports/project-a/video-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: blockedVideoWorkflow }),
      }),
    )
    const blockedVideoPayload = await blockedVideoResponse.json()
    const videoWorkflow = evaluateLipsync(
      blockedVideoWorkflow,
      passingLipsyncChecks,
      [],
      createLipsyncEvaluatorEvidence(blockedVideoWorkflow.musicVideoLane!),
    )
    const videoResponse = await route(
      new Request('http://local.test/api/provider-exports/project-a/video-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: videoWorkflow }),
      }),
    )
    const videoPayload = await videoResponse.json()

    expect(callbackResponse.status).toBe(200)
    expect(blockedVideoResponse.status).toBe(200)
    expect(blockedVideoPayload.state.exports.downloads.some((download: { kind: string }) => download.kind === 'video')).toBe(
      false,
    )
    expect(videoResponse.status).toBe(200)
    expect(videoPayload.state.exports.downloads.some((download: { kind: string }) => download.kind === 'video')).toBe(
      true,
    )
    expect(JSON.stringify(videoPayload)).not.toContain('server-secret')
  })

  it('rejects oversized node request bodies before buffering them fully', async () => {
    const middleware = createProviderExportNodeMiddleware(
      createProviderExportHandlers({
        adapter: createSunoApiServerAdapter({ runtime: 'server' }),
        store: createMemoryProviderExportStore(),
      }),
    )
    const request = Readable.from(['x'.repeat(1_048_577)]) as IncomingMessage
    request.url = '/api/provider-exports/project-a/poll-generation-task'
    request.method = 'POST'
    request.headers = { 'content-type': 'application/json' }
    const response = createWritableResponse()

    await middleware(request, response.response, () => {
      throw new Error('next should not be called for provider export routes')
    })

    expect(response.statusCode()).toBe(413)
    expect(response.body()).toContain('request body too large')
  })
})

function createWritableResponse() {
  let statusCode = 200
  let body = ''
  const headers = new Map<string, string | number | readonly string[]>()
  const response = {
    set statusCode(value: number) {
      statusCode = value
    },
    get statusCode() {
      return statusCode
    },
    setHeader(key: string, value: string | number | readonly string[]) {
      headers.set(key, value)
      return response as unknown as ServerResponse
    },
    end(value?: string) {
      body = value ?? ''
      return response as unknown as ServerResponse
    },
  } as unknown as ServerResponse

  return {
    response,
    statusCode: () => statusCode,
    body: () => body,
    headers: () => headers,
  }
}
