import { describe, expect, it } from 'vitest'
import { createWorkflow, recordProviderTaskUpdate, submitGenerationBatch } from '../domain/workflow'
import { exportSnapshotFromWorkflow } from './exportState'
import { createFetchProviderExportRuntimeClient } from './exportRuntime'

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
})
