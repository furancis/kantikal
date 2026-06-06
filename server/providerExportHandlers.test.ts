import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { createWorkflow, selectTrack, submitGenerationBatch } from '../src/domain/workflow'
import {
  createFileProviderExportStore,
  createMemoryProviderExportStore,
  createProviderExportHandlers,
} from './providerExportHandlers'
import { createMusicApiServerAdapter } from './musicApiAdapter'

function workflowWithProviderTask() {
  return selectTrack(
    submitGenerationBatch(
      createWorkflow({
        brief: 'Server export hook',
        lyrics: 'Verse chorus',
        style: 'cinematic pop',
        voice: 'consented lead',
      }),
      {
        providerJobId: 'task_123',
        tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
      },
    ),
    'song_a',
  )
}

describe('provider export route handlers', () => {
  it('polls provider record-info, normalizes downloads, and persists export state without secrets', async () => {
    const calls: string[] = []
    const adapter = createMusicApiServerAdapter({
      runtime: 'server',
      apiKey: 'server-secret',
      baseUrl: 'https://api.providerapi.org',
      fetchImpl: async (url) => {
        calls.push(String(url))
        return new Response(
          JSON.stringify({
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
                    vocal_url: 'https://cdn.example/song-a-vocals.mp3',
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })
    const store = createMemoryProviderExportStore()
    const handlers = createProviderExportHandlers({ adapter, store })

    const result = await handlers.pollProviderTask({
      projectId: 'project-a',
      workflow: workflowWithProviderTask(),
      providerTaskId: 'task_123',
      action: 'pollGenerationStatus',
      capability: 'Get music generation details',
      receiptId: 'poll-task-123',
    })

    expect(calls).toEqual(['https://api.providerapi.org/api/v1/generate/record-info?taskId=task_123'])
    expect(result.state.exports.tasks).toEqual([
      expect.objectContaining({
        providerTaskId: 'task_123',
        status: 'ready',
      }),
    ])
    expect(result.state.exports.downloads.map((download) => `${download.kind}:${download.status}`)).toEqual([
      'audio:ready',
      'cover-art:ready',
      'stem:ready',
    ])

    const persisted = await store.load('project-a')
    expect(persisted?.exports.downloads).toHaveLength(3)
    expect(JSON.stringify(persisted)).not.toContain('server-secret')
  })

  it('receives provider callbacks idempotently and keeps one callback receipt per task/type', async () => {
    const store = createMemoryProviderExportStore()
    const handlers = createProviderExportHandlers({
      adapter: createMusicApiServerAdapter({ runtime: 'server' }),
      store,
    })
    const workflow = workflowWithProviderTask()
    const callbackBody = {
      code: 200,
      msg: 'All generated successfully.',
      data: {
        callbackType: 'complete',
        task_id: 'task_123',
        data: [
          {
            id: 'song_a',
            title: 'Night Lift A',
            audio_url: 'https://cdn.example/song-a.mp3',
            image_url: 'https://cdn.example/song-a.jpeg',
          },
        ],
      },
    }

    await handlers.receiveProviderCallback({
      projectId: 'project-a',
      workflow,
      body: callbackBody,
      action: 'handleProviderCallback',
      capability: 'Webhooks/retries',
      receiptId: 'callback-task-123',
    })
    const second = await handlers.receiveProviderCallback({
      projectId: 'project-a',
      workflow,
      body: callbackBody,
      action: 'handleProviderCallback',
      capability: 'Webhooks/retries',
      receiptId: 'callback-task-123',
    })

    expect(second.state.exports.callbacks).toEqual([
      expect.objectContaining({
        providerTaskId: 'task_123',
        callbackType: 'complete',
        status: 'received',
      }),
    ])
    expect(second.state.exports.downloads).toHaveLength(2)
  })

  it('reloads file-backed export state across store instances without credential material', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'provider-export-store-'))
    const filePath = join(dir, 'exports.json')
    const firstStore = createFileProviderExportStore(filePath)
    const workflow = workflowWithProviderTask()
    const state = {
      projectId: 'project-a',
      projectAssets: workflow.projectAssets,
      exports: workflow.exports,
      jobQueue: workflow.jobQueue,
      provenance: [...workflow.provenance, 'provider-download-assets'],
    }

    try {
      await firstStore.save('project-a', state)
      const secondStore = createFileProviderExportStore(filePath)
      const reloaded = await secondStore.load('project-a')

      expect(reloaded).toEqual(state)
      expect(JSON.stringify(reloaded)).not.toContain('server-secret')
      expect(JSON.stringify(reloaded)).not.toContain('apiKey')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('serializes concurrent file-backed saves so projects do not overwrite each other', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'provider-export-store-'))
    const filePath = join(dir, 'exports.json')
    const store = createFileProviderExportStore(filePath)
    const workflow = workflowWithProviderTask()
    const projectA = {
      projectId: 'project-a',
      projectAssets: workflow.projectAssets,
      exports: workflow.exports,
      jobQueue: workflow.jobQueue,
      provenance: [...workflow.provenance, 'provider-download-assets'],
    }
    const projectB = {
      ...projectA,
      projectId: 'project-b',
      provenance: [...projectA.provenance, 'project-b-export'],
    }

    try {
      await Promise.all([store.save('project-a', projectA), store.save('project-b', projectB)])

      await expect(store.load('project-a')).resolves.toEqual(projectA)
      await expect(store.load('project-b')).resolves.toEqual(projectB)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('ignores malformed persisted snapshots instead of hydrating partial export state', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'provider-export-store-'))
    const filePath = join(dir, 'exports.json')
    const store = createFileProviderExportStore(filePath)
    const workflow = workflowWithProviderTask()
    const validState = {
      projectId: 'project-good',
      projectAssets: workflow.projectAssets,
      exports: workflow.exports,
      jobQueue: workflow.jobQueue,
      provenance: workflow.provenance,
    }

    try {
      await writeFile(
        filePath,
        JSON.stringify({
          'project-bad': { projectId: 'project-bad', exports: {} },
          'project-good': validState,
        }),
        'utf8',
      )

      await expect(store.load('project-bad')).resolves.toBeNull()
      await expect(store.load('project-good')).resolves.toEqual(validState)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
