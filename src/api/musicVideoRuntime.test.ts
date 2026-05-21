import { describe, expect, it } from 'vitest'
import {
  createWorkflow,
  openMusicVideoLane,
  queueLipsyncRepair,
  selectTrack,
  submitGenerationBatch,
} from '../domain/workflow'
import { createFetchMusicVideoRuntimeClient, createLocalMusicVideoRuntimeClient } from './musicVideoRuntime'

function workflowWithVideoLane() {
  const generated = submitGenerationBatch(
    createWorkflow({
      brief: 'Runtime hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      voice: 'consented lead',
    }),
    {
      providerJobId: 'task_runtime',
      tracks: [{ id: 'song_runtime', title: 'Runtime Song', durationSeconds: 154 }],
    },
  )

  return openMusicVideoLane(selectTrack(generated, 'song_runtime'))
}

describe('music video runtime client', () => {
  it('produces evaluator evidence and keeps first-pass lipsync failures blocked', async () => {
    const client = createLocalMusicVideoRuntimeClient()
    const workflow = await client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() })

    expect(workflow.musicVideoLane).toMatchObject({
      exportStatus: 'blocked',
      lipsync: {
        phoneme: true,
        frame: true,
        mouthShape: true,
        segmentDrift: false,
        postStitch: false,
      },
    })
    expect(workflow.musicVideoLane?.lipsyncEvidence).toMatchObject({
      evaluator: 'local-worker',
      sourceTrackId: 'song_runtime',
      failureRanges: [
        expect.objectContaining({ checkName: 'segmentDrift' }),
        expect.objectContaining({ checkName: 'postStitch' }),
      ],
    })
  })

  it('approves video export only after a queued repair produces passing evaluator evidence', async () => {
    const client = createLocalMusicVideoRuntimeClient()
    const firstPass = await client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() })
    const repaired = await client.evaluateLipsync({
      projectId: 'project-a',
      workflow: queueLipsyncRepair(firstPass),
    })

    expect(repaired.musicVideoLane?.exportStatus).toBe('ready')
    expect(repaired.musicVideoLane?.failureRanges).toEqual([])
    expect(repaired.musicVideoLane?.lipsyncEvidence).toMatchObject({
      sourceTrackId: 'song_runtime',
      failureRanges: [],
      checks: {
        segmentDrift: true,
        postStitch: true,
      },
    })
  })

  it('keeps already approved local lipsync evidence approved on re-evaluation', async () => {
    const client = createLocalMusicVideoRuntimeClient()
    const firstPass = await client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() })
    const repaired = await client.evaluateLipsync({
      projectId: 'project-a',
      workflow: queueLipsyncRepair(firstPass),
    })
    const rechecked = await client.evaluateLipsync({ projectId: 'project-a', workflow: repaired })

    expect(rechecked.musicVideoLane?.exportStatus).toBe('ready')
    expect(rechecked.musicVideoLane?.failureRanges).toEqual([])
    expect(rechecked.musicVideoLane?.lipsyncEvidence).toEqual(repaired.musicVideoLane?.lipsyncEvidence)
  })

  it('uses mounted HTTP music-video runtime routes when available', async () => {
    const routedWorkflow = await createLocalMusicVideoRuntimeClient().evaluateLipsync({
      projectId: 'project-a',
      workflow: workflowWithVideoLane(),
    })
    const calls: Array<{ url: string; body: string }> = []
    const client = createFetchMusicVideoRuntimeClient({
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), body: String(init?.body ?? '') })
        return new Response(JSON.stringify({ workflow: routedWorkflow }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const workflow = await client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() })

    expect(calls[0].url).toBe('/api/music-video/project-a/evaluate-lipsync')
    expect(JSON.parse(calls[0].body)).toMatchObject({ workflow: { selectedTrack: { id: 'song_runtime' } } })
    expect(workflow).toEqual(routedWorkflow)
  })

  it('surfaces mounted HTTP route failures instead of falling back to local QA', async () => {
    const client = createFetchMusicVideoRuntimeClient({
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'music video worker database unavailable' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(
      client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() }),
    ).rejects.toThrow(/music video worker database unavailable/i)
  })

  it('surfaces non-runtime HTML instead of approving local QA without an explicit fixture fallback', async () => {
    const client = createFetchMusicVideoRuntimeClient({
      fetchImpl: async () =>
        new Response('<!doctype html><title>Vite app</title>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
    })

    await expect(
      client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() }),
    ).rejects.toThrow(/music video runtime failed/i)
  })

  it('surfaces missing workflow payloads unless a test fixture fallback is explicit', async () => {
    const client = createFetchMusicVideoRuntimeClient({
      fetchImpl: async () =>
        new Response(JSON.stringify({ route: 'app-shell' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(
      client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() }),
    ).rejects.toThrow(/returned no workflow/i)
  })

  it('allows local QA only when a caller explicitly injects the fixture fallback', async () => {
    const client = createFetchMusicVideoRuntimeClient({
      fallback: createLocalMusicVideoRuntimeClient(),
      fetchImpl: async () =>
        new Response(JSON.stringify({ route: 'app-shell' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    const workflow = await client.evaluateLipsync({ projectId: 'project-a', workflow: workflowWithVideoLane() })
    expect(workflow.musicVideoLane?.exportStatus).toBe('blocked')
    expect(workflow.musicVideoLane?.lipsyncEvidence?.evaluator).toBe('local-worker')
  })
})
