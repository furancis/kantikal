import { describe, expect, it } from 'vitest'
import {
  createWorkflow,
  evaluateLipsync,
  openMusicVideoLane,
  recordProviderTaskUpdate,
  selectTrack,
  submitGenerationBatch,
} from '../domain/workflow'
import { createLipsyncEvaluatorEvidence, passingLipsyncChecks } from '../test/lipsyncEvidence'
import { exportSnapshotFromWorkflow } from './exportState'
import { createFetchProviderExportRuntimeClient, createLocalProviderExportRuntimeClient } from './exportRuntime'

function workflowWithGeneration() {
  return submitGenerationBatch(
    createWorkflow({
      brief: 'Fetch route hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      voice: 'consented lead',
    }),
    {
      providerJobId: 'task_fetch',
      tracks: [{ id: 'song_fetch', title: 'Fetch Route Song', durationSeconds: 154 }],
    },
  )
}

describe('fetch provider export runtime client', () => {
  it('uses HTTP provider export routes when they are mounted', async () => {
    const workflow = workflowWithGeneration()
    const routedWorkflow = recordProviderTaskUpdate(workflow, {
      providerTaskId: 'task_fetch',
      action: 'pollGenerationStatus',
      capability: 'Get music generation details',
      providerStatus: 'SUCCESS',
      message: 'HTTP provider export route produced local downloadable outputs',
      outputs: [
        {
          kind: 'audio',
          label: 'Fetch Route Song master audio',
          url: 'https://cdn.example/song.mp3',
          sourceTrackId: 'song_fetch',
        },
      ],
      receiptId: 'poll-task-fetch',
    })
    const calls: Array<{ url: string; body: string }> = []
    const client = createFetchProviderExportRuntimeClient({
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), body: String(init?.body ?? '') })
        return new Response(
          JSON.stringify({ state: exportSnapshotFromWorkflow('project-a', routedWorkflow) }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })

    const state = await client.pollGenerationTask({ projectId: 'project-a', workflow })

    expect(calls[0].url).toBe('/api/provider-exports/project-a/poll-generation-task')
    expect(JSON.parse(calls[0].body)).toMatchObject({ workflow: { generationBatch: { providerJobId: 'task_fetch' } } })
    expect(state.exports.tasks[0]).toMatchObject({
      providerTaskId: 'task_fetch',
      message: 'HTTP provider export route produced local downloadable outputs',
    })
  })

  it('falls back to the local runtime when the HTTP route is unavailable', async () => {
    const client = createFetchProviderExportRuntimeClient({
      fetchImpl: async () => {
        throw new Error('route unavailable')
      },
    })

    const state = await client.pollGenerationTask({ projectId: 'project-a', workflow: workflowWithGeneration() })

    expect(state.exports.tasks[0]).toMatchObject({
      providerTaskId: 'task_fetch',
      status: 'ready',
    })
    expect(state.exports.downloads.map((download) => download.kind)).toEqual(['audio', 'cover-art', 'stem'])
  })

  it('surfaces mounted HTTP route failures instead of falling back to local state', async () => {
    const client = createFetchProviderExportRuntimeClient({
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'export route database unavailable' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(
      client.pollGenerationTask({ projectId: 'project-a', workflow: workflowWithGeneration() }),
    ).rejects.toThrow(/export route database unavailable/i)
  })

  it('rejects malformed mounted HTTP route payloads instead of falling back to local state', async () => {
    const client = createFetchProviderExportRuntimeClient({
      fetchImpl: async () =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(
      client.pollGenerationTask({ projectId: 'project-a', workflow: workflowWithGeneration() }),
    ).rejects.toThrow(/returned no state/i)
  })

  it('preserves an explicit null hydrate response from the HTTP route', async () => {
    const fallbackSnapshot = exportSnapshotFromWorkflow('project-a', workflowWithGeneration())
    const client = createFetchProviderExportRuntimeClient({
      fallback: {
        async hydrate() {
          return fallbackSnapshot
        },
        async pollGenerationTask() {
          return fallbackSnapshot
        },
        async receiveFailedCallback() {
          return fallbackSnapshot
        },
        async recordProviderVideoOutput() {
          return fallbackSnapshot
        },
      },
      fetchImpl: async () =>
        new Response(JSON.stringify({ state: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    })

    await expect(client.hydrate('project-a')).resolves.toBeNull()
  })

  it('keeps local video output blocked until lipsync QA has passed', async () => {
    const client = createLocalProviderExportRuntimeClient()
    const videoWorkflow = openMusicVideoLane(selectTrack(workflowWithGeneration(), 'song_fetch'))

    const blocked = await client.recordProviderVideoOutput({ projectId: 'project-a', workflow: videoWorkflow })
    const passed = await client.recordProviderVideoOutput({
      projectId: 'project-a',
      workflow: evaluateLipsync(
        videoWorkflow,
        passingLipsyncChecks,
        [],
        createLipsyncEvaluatorEvidence(videoWorkflow.musicVideoLane!),
      ),
    })

    expect(blocked.exports.downloads.some((download) => download.kind === 'video')).toBe(false)
    expect(blocked.exports.tasks[0]).toMatchObject({
      action: 'createProviderMusicVideo',
      status: 'failed',
    })
    expect(passed.exports.downloads.some((download) => download.kind === 'video')).toBe(true)
  })
})
