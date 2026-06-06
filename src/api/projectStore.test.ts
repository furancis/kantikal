import { describe, expect, it } from 'vitest'
import {
  applyArchiveFirstCleanup,
  createWorkflow,
  evaluateLipsync,
  openMusicVideoLane,
  openSongLab,
  planArchiveFirstCleanup,
  recordProviderJobResult,
  recordProviderTaskUpdate,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
  type providerWorkflow,
} from '../domain/workflow'
import {
  createFetchProjectStore,
  createMemoryProjectStore,
  projectSnapshotFromState,
  summarizeProject,
} from './projectStore'
import { createLipsyncEvaluatorEvidence, passingLipsyncChecks } from '../test/lipsyncEvidence'

const briefInput = {
  brief: 'Persistent khaliji hook',
  lyrics: 'Verse chorus bridge',
  style: 'Gulf percussion and club polish',
  voice: 'Consented tenor persona',
}

function fullWorkflow(): providerWorkflow {
  const generated = submitGenerationBatch(createWorkflow(briefInput), {
    providerJobId: 'task_persist',
    tracks: [
      { id: 'persist-track-1', title: 'Persistent hook take 1', durationSeconds: 148 },
      { id: 'persist-track-2', title: 'Persistent hook take 2', durationSeconds: 152 },
    ],
  })
  const selected = selectTrack(generated, 'persist-track-2')
  const songLab = openSongLab(selected)
  const videoOpen = openMusicVideoLane(songLab)
  const videoReady = evaluateLipsync(
    videoOpen,
    passingLipsyncChecks,
    [],
    createLipsyncEvaluatorEvidence(videoOpen.musicVideoLane!),
  )
  const exported = recordProviderTaskUpdate(videoReady, {
    providerTaskId: 'task_persist',
    action: 'pollGenerationStatus',
    capability: 'Get music generation details',
    providerStatus: 'SUCCESS',
    message: 'Persisted export outputs',
    outputs: [
      {
        kind: 'audio',
        label: 'Persistent hook master audio',
        url: 'local-export://persist/master.mp3',
        sourceTrackId: 'persist-track-2',
      },
    ],
    receiptId: 'poll-task-persist',
  })
  const blockedJob = recordProviderJobResult(exported, {
    action: 'renderMusicVideo',
    capability: 'Music-video render',
    outcome: 'blocked',
    message: 'Worker unavailable',
    authBoundary: 'server',
    receiptId: 'blocked-video-worker',
  })
  return applyArchiveFirstCleanup(
    planArchiveFirstCleanup(blockedJob, ['persist-track-1'], 'discard alternate generated take'),
  )
}

describe('project workflow store', () => {
  it('persists full workflow snapshots while stripping credential-like fields', async () => {
    const workflow = fullWorkflow()
    const bearerPrefix = 'Bear' + 'er'
    const workflowWithCredential = {
      ...workflow,
      apiKey: ['server', 'secret', 'value'].join('-'),
      nested: { authorization: `${bearerPrefix} ${['provider', 'token', 'value'].join('-')}+/=` },
    } as unknown as providerWorkflow

    const snapshot = projectSnapshotFromState({
      projectId: 'project-persist',
      briefInput,
      workflow: workflowWithCredential,
      releasePack: toReleasePack(workflow, { includeVideo: true }),
    })

    expect(snapshot.workflow.selectedTrack?.id).toBe('persist-track-2')
    expect(snapshot.workflow.musicVideoLane?.exportStatus).toBe('ready')
    expect(snapshot.releasePack?.includesVideo).toBe(true)
    expect(JSON.stringify(snapshot)).not.toContain('server-secret-value')
    expect(JSON.stringify(snapshot)).not.toContain('provider-token-value+/=')
    expect(JSON.stringify(snapshot)).not.toContain('apiKey')
    expect(JSON.stringify(snapshot)).not.toContain('authorization')
  })

  it('downgrades persisted video-ready state when lipsync proof is missing', async () => {
    const workflow = fullWorkflow()
    const forgedWorkflow = {
      ...workflow,
      musicVideoLane: {
        ...workflow.musicVideoLane!,
        exportStatus: 'ready' as const,
        lipsync: null,
      },
    }

    const snapshot = projectSnapshotFromState({
      projectId: 'project-forged',
      briefInput,
      workflow: forgedWorkflow,
      releasePack: toReleasePack(workflow, { includeVideo: true }),
    })

    expect(snapshot.workflow.musicVideoLane?.exportStatus).toBe('blocked')
    expect(snapshot.releasePack).toBeNull()
  })

  it('summarizes recent projects with brief, selected track, job/export counts, and blocked gates', async () => {
    const store = createMemoryProjectStore()
    const workflow = fullWorkflow()
    const saved = await store.saveProject(
      projectSnapshotFromState({
        projectId: 'project-persist',
        briefInput,
        workflow,
        releasePack: toReleasePack(workflow, { includeVideo: true }),
      }),
    )

    expect(saved).toMatchObject({
      projectId: 'project-persist',
      brief: 'Persistent khaliji hook',
      selectedTrackId: 'persist-track-2',
      selectedTrackTitle: 'Persistent hook take 2',
      jobCount: 2,
      exportCount: 1,
      releasePackLabel: 'audio, video',
    })
    expect(saved.blockedGateCount).toBeGreaterThan(0)

    await expect(store.loadProject('project-persist')).resolves.toMatchObject({
      workflow: {
        selectedTrack: { id: 'persist-track-2' },
        cleanupPlan: { status: 'applied' },
      },
    })
    await expect(store.listProjects()).resolves.toEqual([summarizeProject((await store.loadProject('project-persist'))!)])
  })

  it('uses HTTP project database routes when mounted', async () => {
    const workflow = fullWorkflow()
    const snapshot = projectSnapshotFromState({
      projectId: 'project-http',
      briefInput,
      workflow,
      releasePack: toReleasePack(workflow, { includeVideo: true }),
      savedAt: '2026-05-21T00:00:00.000Z',
    })
    const calls: Array<{ url: string; method: string }> = []
    const store = createFetchProjectStore({
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), method: init?.method ?? 'GET' })
        if (init?.method === 'PUT') {
          return new Response(JSON.stringify({ summary: summarizeProject(snapshot) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (String(url).endsWith('/api/projects')) {
          return new Response(JSON.stringify({ projects: [summarizeProject(snapshot)] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ snapshot }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    await expect(store.saveProject(snapshot)).resolves.toMatchObject({ projectId: 'project-http' })
    await expect(store.loadProject('project-http')).resolves.toMatchObject({ projectId: 'project-http' })
    await expect(store.listProjects()).resolves.toEqual([expect.objectContaining({ projectId: 'project-http' })])
    expect(calls).toEqual([
      { url: '/api/projects/project-http', method: 'PUT' },
      { url: '/api/projects/project-http', method: 'GET' },
      { url: '/api/projects', method: 'GET' },
    ])
  })
})
