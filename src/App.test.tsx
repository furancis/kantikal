import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import {
  createMemoryProjectStore,
  projectSnapshotFromState,
  type ProjectStore,
  type ProjectWorkflowSnapshot,
} from './api/projectStore'
import type { SunoProvider } from './api/provider'
import type { ProviderExportRuntimeClient } from './api/exportRuntime'
import type { MusicVideoRuntimeClient } from './api/musicVideoRuntime'
import {
  applyArchiveFirstCleanup,
  createWorkflow,
  evaluateLipsync,
  lockSongLabRegion,
  openMusicVideoLane,
  openSongLab,
  planArchiveFirstCleanup,
  recordProviderTaskUpdate,
  saveSelectedTrackToLocalLibrary,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
  queueSongLabEdit,
  type GenerationBatch,
  type LipsyncChecks,
  type LipsyncEvaluatorEvidence,
  type MusicVideoLane,
  type SunoWorkflow,
} from './domain/workflow'

const passingLipsyncChecks: LipsyncChecks = {
  phoneme: true,
  frame: true,
  mouthShape: true,
  segmentDrift: true,
  postStitch: true,
}

function evaluatorEvidence(lane: MusicVideoLane): LipsyncEvaluatorEvidence {
  return {
    id: `test-lipsync-evidence-${lane.sourceTrackId}`,
    evaluator: 'local-worker',
    sourceTrackId: lane.sourceTrackId,
    sourceVideoUrl: `local-export://${lane.sourceTrackId}/stitched-video.mp4`,
    checkedAt: '1970-01-01T00:00:00.000Z',
    checks: passingLipsyncChecks,
    metrics: {
      phonemeDriftMs: 10,
      frameOffsetFrames: 0,
      mouthShapeScore: 0.98,
      segmentDriftMs: 14,
      postStitchDriftMs: 16,
    },
    thresholds: {
      phonemeDriftMs: 35,
      frameOffsetFrames: 1,
      mouthShapeScore: 0.92,
      segmentDriftMs: 45,
      postStitchDriftMs: 45,
    },
    failureRanges: [],
  }
}

const persistedBrief = {
  brief: 'Hydrated khaliji hook',
  lyrics: 'Verse chorus bridge',
  style: 'Gulf percussion and electro-pop',
  voice: 'Consented hydrated tenor',
}

function persistedWorkflowFixture(trackPrefix = 'hydrated'): SunoWorkflow {
  const generated = submitGenerationBatch(createWorkflow(persistedBrief), {
    providerJobId: `task_${trackPrefix}`,
    tracks: [
      { id: `${trackPrefix}-track-1`, title: 'Hydrated hook take 1', durationSeconds: 148 },
      { id: `${trackPrefix}-track-2`, title: 'Hydrated hook take 2', durationSeconds: 152 },
    ],
  })
  const selected = selectTrack(generated, `${trackPrefix}-track-2`)
  const songLab = queueSongLabEdit(lockSongLabRegion(openSongLab(selected), 'hook'), {
    sectionId: 'hook',
    action: 'replaceSection',
    label: 'Replace hydrated hook',
  })
  const saved = saveSelectedTrackToLocalLibrary(songLab, {
    notes: 'Saved hydrated track',
    tags: ['hydrated'],
  })
  const videoOpen = openMusicVideoLane(saved)
  const videoReady = evaluateLipsync(videoOpen, passingLipsyncChecks, [], evaluatorEvidence(videoOpen.musicVideoLane!))
  const exported = recordProviderTaskUpdate(videoReady, {
    providerTaskId: `task_${trackPrefix}`,
    action: 'pollGenerationStatus',
    capability: 'Get music generation details',
    providerStatus: 'SUCCESS',
    message: 'Hydrated export outputs',
    outputs: [
      {
        kind: 'audio',
        label: 'Hydrated hook master audio',
        url: `local-export://${trackPrefix}/master.mp3`,
        sourceTrackId: `${trackPrefix}-track-2`,
      },
    ],
    receiptId: `poll-task-${trackPrefix}`,
  })
  return applyArchiveFirstCleanup(
    planArchiveFirstCleanup(exported, [`${trackPrefix}-track-1`], 'discard hydrated alternate take'),
  )
}

describe('Suno Visual Studio shell', () => {
  it('keeps the music video lane subordinate to the song workflow', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /track-first visual music studio/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /track-first command room/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /no selected source track/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /generate suno batch/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/runtime status/i)).toHaveTextContent(/Suno web \/ Printing Press/i)
    expect(screen.getByLabelText(/runtime status/i)).toHaveTextContent(/optional adapter/i)
    expect(screen.getByLabelText(/runtime status/i)).toHaveTextContent(/ComfyUI/i)
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeDisabled()
    expect(screen.getByText(/select a generated track before opening video/i)).toBeInTheDocument()
    expect(screen.getByText(/54 mapped capabilities/i)).toBeInTheDocument()
    expect(screen.getByText(/custom voice creation/i)).toBeInTheDocument()
    expect(screen.getByText(/^WAV conversion$/i)).toBeInTheDocument()
  })

  it('creates editable workflow objects from the visual app', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('heading', { name: /perfect lipsync gate/i })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.clear(screen.getByLabelText(/lyrics/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/lyrics/i, { selector: 'textarea' }), 'Verse pre chorus')
    await user.clear(screen.getByLabelText(/style/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/style/i, { selector: 'input' }), 'Gulf percussion and electro-pop')
    await user.clear(screen.getByLabelText(/voice/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/voice/i, { selector: 'input' }), 'Consented bright tenor persona')

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))

    expect(await screen.findByRole('button', { name: /neon khaliji club hook v1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neon khaliji club hook v2/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /choose source track/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generated track mock-track-2/i }))

    expect(screen.getByRole('heading', { name: /chosen track/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /neon khaliji club hook v2 \(mock-track-2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /open song lab/i })).toBeInTheDocument()
    expect(screen.getByText(/selected source: mock-track-2/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /open music video lane/i }))

    expect(screen.getByRole('heading', { name: /perfect lipsync gate/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /scene cards/i })).toBeInTheDocument()
    expect(screen.getByText(/hook scene/i)).toBeInTheDocument()
    expect(screen.getByText(/65s-108s/i)).toBeInTheDocument()
    expect(screen.getByText(/ComfyUI render worker planned/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /plan comfyui render graph/i }))
    expect(screen.getAllByText(/wan-video-lipsync/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/scene-prompts/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /queue music video render/i }))
    expect(screen.getByText(/ComfyUI render worker blocked/i)).toBeInTheDocument()
    expect(screen.getByText(/stitch worker queued/i)).toBeInTheDocument()
    expect(screen.getByText(/lipsync qa worker queued/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/segment drift qa result/i)).toHaveTextContent(/pending/i)
    expect(screen.getByLabelText(/post-stitch sync qa result/i)).toHaveTextContent(/pending/i)
    expect(screen.getByText(/full suno capability map/i)).toBeInTheDocument()
    expect(screen.getByText(/archive-first destructive cleanup/i)).toBeInTheDocument()
    expect(screen.getByText(/music video source: mock-track-2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create video release pack/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/blocked until lipsync qa passes/i)

    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))
    expect(screen.getByLabelText(/phoneme lock qa result/i)).toHaveTextContent(/pass/i)
    expect(screen.getByLabelText(/segment drift qa result/i)).toHaveTextContent(/repair required/i)
    expect(screen.getByLabelText(/post-stitch sync qa result/i)).toHaveTextContent(/repair required/i)
    expect(screen.getByText(/exact failure ranges/i)).toBeInTheDocument()
    expect(screen.getByText(/range-segmentDrift-1/i)).toBeInTheDocument()
    expect(screen.getAllByText(/65s-108s/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /queue repair pass/i }))
    expect(screen.getByText(/repair-1 queued/i)).toBeInTheDocument()
    expect(screen.getByText(/segment drift, post-stitch/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))
    expect(screen.getByLabelText(/video export gate state/i)).toHaveTextContent(/video export ready/i)
    expect(screen.getByLabelText(/segment drift qa result/i)).toHaveTextContent(/pass/i)
    expect(screen.getByText(/repair-1 applied/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run lipsync qa/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /create video release pack/i }))
    expect(screen.getByRole('heading', { name: /release pack/i })).toBeInTheDocument()
    expect(screen.getByText(/video included/i)).toBeInTheDocument()
  }, 15000)

  it('shows Track Genealogy as a selected-track subfeature with traits, mutation diff, fit, and breeding', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /generated track mock-track-2/i }))

    await user.click(screen.getByRole('button', { name: /version comparison/i }))
    await user.click(screen.getByRole('button', { name: /rate mock-track-2 as taste match/i }))
    await user.click(screen.getByRole('button', { name: /compare mock-track-1 vs mock-track-2/i }))
    await user.click(screen.getByRole('button', { name: /track genealogy: family tree/i }))

    expect(screen.getByRole('heading', { name: /Track Genealogy/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Family Tree Graph/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Track Genealogy family tree graph/i)).toHaveTextContent(/Brief DNA/i)
    expect(screen.getByLabelText(/Track Genealogy family tree graph/i)).toHaveTextContent(/mock-track-2/i)
    expect(screen.getByRole('heading', { name: /Trait Inspector/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Track Genealogy trait inspector/i)).toHaveTextContent(/vocal identity/i)
    expect(screen.getByRole('heading', { name: /Version Mutation Diff/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Track Genealogy mutation diff/i)).toHaveTextContent(/duration -4s vs selected source/i)
    expect(screen.getByRole('heading', { name: /Branch Fit Score/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Track Genealogy branch fit score/i)).toHaveTextContent(/mock-track-2 fit 5\/5/i)
    expect(screen.getByRole('heading', { name: /Reference DNA Import/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Archive\/Prune Branches/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Generate From This Lineage/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Track Genealogy breeding suggestions/i)).toHaveTextContent(
      /combine mock-track-2 with mock-track-1/i,
    )

    await user.click(screen.getByRole('button', { name: /generate from this lineage/i }))

    expect(await screen.findByRole('button', { name: /v1: Generated track mock-track-1, 150s/i })).toBeInTheDocument()
  })

  it('surfaces provider failures instead of dropping rejected generation promises', async () => {
    const user = userEvent.setup()
    const failingProvider: SunoProvider = {
      async generateBatch() {
        throw new Error('Provider rate limit')
      },
    }

    render(<App provider={failingProvider} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/provider rate limit/i)
    expect(screen.queryByRole('button', { name: /gulf chorus engine v1/i })).not.toBeInTheDocument()
  })

  it('keeps the current release pack when a replacement generation fails', async () => {
    const user = userEvent.setup()
    let calls = 0
    const flakyProvider: SunoProvider = {
      async generateBatch() {
        calls += 1
        if (calls === 1) {
          return {
            providerJobId: 'first-provider-job',
            tracks: [{ id: 'first-track-1', title: 'First provider v1', durationSeconds: 150 }],
          }
        }

        throw new Error('Provider rate limit')
      },
    }

    render(<App provider={flakyProvider} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /first provider v1/i }))
    await user.click(screen.getByRole('button', { name: /create audio release pack/i }))

    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/provider rate limit/i)
    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()
  })

  it('keeps the current release pack when a replacement batch is rejected', async () => {
    const user = userEvent.setup()
    let calls = 0
    const emptyBatchProvider: SunoProvider = {
      async generateBatch() {
        calls += 1
        if (calls === 1) {
          return {
            providerJobId: 'first-provider-job',
            tracks: [{ id: 'first-track-1', title: 'First provider v1', durationSeconds: 150 }],
          }
        }

        return {
          providerJobId: 'empty-provider-job',
          tracks: [],
        }
      },
    }

    render(<App provider={emptyBatchProvider} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /first provider v1/i }))
    await user.click(screen.getByRole('button', { name: /create audio release pack/i }))

    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/requires at least one track/i)
    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()
  })

  it('runs API coverage actions through the provider action lane', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /run api action create song/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/create song/i)
    expect(screen.getByRole('status')).toHaveTextContent(/succeeded/i)
    expect(screen.getByRole('status')).not.toHaveTextContent(/secret/i)
  })

  it('preserves provider action updates that land while generation is in flight', async () => {
    const user = userEvent.setup()
    let resolveGeneration: (batch: GenerationBatch) => void = () => undefined
    const generationPromise = new Promise<GenerationBatch>((resolve) => {
      resolveGeneration = resolve
    })
    const delayedProvider: SunoProvider = {
      async generateBatch() {
        return generationPromise
      },
      async executeAction(request) {
        return {
          action: request.action,
          capability: request.capability,
          outcome: 'succeeded',
          message: `${request.capability} succeeded mid-generation.`,
          authBoundary: 'server',
          endpoint: '/api/v1/generate',
          providerTaskId: 'mid-generation-provider-action',
          receiptId: 'provider-action-mid-generation',
        }
      },
    }

    render(<App provider={delayedProvider} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(screen.getByRole('button', { name: /run api action create song/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/succeeded mid-generation/i)

    await act(async () => {
      resolveGeneration({
        providerJobId: 'delayed-provider-job',
        tracks: [{ id: 'delayed-track-1', title: 'Delayed provider v1', durationSeconds: 153 }],
      })
      await generationPromise
    })

    expect(await screen.findByRole('button', { name: /delayed provider v1/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /job queue/i }))

    expect(screen.getAllByText(/create song completed/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/mid-generation-provider-action/i).length).toBeGreaterThan(0)
  })

  it('preserves provider action updates that land while lipsync QA is in flight', async () => {
    const user = userEvent.setup()
    let resolveLipsync: (workflow: SunoWorkflow) => void = () => undefined
    const lipsyncPromise = new Promise<SunoWorkflow>((resolve) => {
      resolveLipsync = resolve
    })
    const provider: SunoProvider = {
      async generateBatch() {
        return {
          providerJobId: 'task_lipsync_batch',
          tracks: [{ id: 'lipsync-track-1', title: 'Lipsync provider v1', durationSeconds: 153 }],
        }
      },
      async executeAction(request) {
        return {
          action: request.action,
          capability: request.capability,
          outcome: 'succeeded',
          message: `${request.capability} completed during lipsync.`,
          authBoundary: 'server',
          endpoint: '/api/v1/lyrics',
          providerTaskId: 'task_lipsync_parallel_action',
          receiptId: 'provider-action-lipsync-parallel',
        }
      },
    }
    const musicVideoRuntime: MusicVideoRuntimeClient = {
      evaluateLipsync() {
        return lipsyncPromise
      },
    }

    render(<App provider={provider} musicVideoRuntime={musicVideoRuntime} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /lipsync provider v1/i }))
    await user.click(screen.getByRole('button', { name: /open music video lane/i }))
    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))
    await user.click(screen.getByRole('button', { name: /run api action lyrics generation/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/completed during lipsync/i)

    await act(async () => {
      const runtimeWorkflow = openMusicVideoLane(selectTrack(submitGenerationBatch(createWorkflow(persistedBrief), {
        providerJobId: 'task_lipsync_batch',
        tracks: [{ id: 'lipsync-track-1', title: 'Lipsync provider v1', durationSeconds: 153 }],
      }), 'lipsync-track-1'))
      resolveLipsync(evaluateLipsync(
        runtimeWorkflow,
        passingLipsyncChecks,
        [],
        evaluatorEvidence(runtimeWorkflow.musicVideoLane!),
      ))
      await lipsyncPromise
    })

    expect(screen.getByLabelText(/video export gate state/i)).toHaveTextContent(/video export ready/i)

    await user.click(screen.getByRole('button', { name: /job queue/i }))

    expect(screen.getAllByText(/task_lipsync_parallel_action/i).length).toBeGreaterThan(0)
  })

  it('uses operation-scoped provider task IDs for detail actions before falling back to generation IDs', async () => {
    const user = userEvent.setup()
    const actionRequests: Array<{ action: string; payload?: Record<string, unknown> }> = []
    const provider: SunoProvider = {
      async generateBatch() {
        return {
          providerJobId: 'task_generation_parent',
          tracks: [{ id: 'operation-track-1', title: 'Operation provider v1', durationSeconds: 153 }],
        }
      },
      async executeAction(request) {
        actionRequests.push({
          action: request.action,
          payload: request.payload as Record<string, unknown> | undefined,
        })
        return {
          action: request.action,
          capability: request.capability,
          outcome: 'succeeded',
          message: `${request.capability} dispatched.`,
          authBoundary: 'server',
          endpoint: '/api/v1/provider',
          providerTaskId: request.action === 'createProviderMusicVideo' ? 'task_music_video_child' : `task_${request.action}`,
          receiptId: `provider-action-${request.action}`,
        }
      },
    }

    render(<App provider={provider} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /operation provider v1/i }))
    await user.click(screen.getByRole('button', { name: /run api action provider music video creation/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/provider music video creation dispatched/i)
    expect(actionRequests.find((request) => request.action === 'createProviderMusicVideo')?.payload).toMatchObject({
      taskId: 'task_generation_parent',
      providerTaskId: 'task_generation_parent',
    })

    await user.click(screen.getByRole('button', { name: /run api action music video task details/i }))

    await waitFor(() => {
      expect(actionRequests.find((request) => request.action === 'getMusicVideoDetails')?.payload).toMatchObject({
        taskId: 'task_music_video_child',
        providerTaskId: 'task_music_video_child',
      })
    })
    expect(actionRequests.find((request) => request.action === 'getMusicVideoDetails')?.payload).not.toMatchObject({
      taskId: 'task_generation_parent',
    })
  })

  it('surfaces comparison, Song Lab, queue, and local library workflow state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))

    await user.click(screen.getByRole('button', { name: /version comparison/i }))
    await user.click(screen.getByRole('button', { name: /rate mock-track-2 as taste match/i }))
    await user.click(screen.getByRole('button', { name: /compare mock-track-1 vs mock-track-2/i }))

    expect(screen.getByText(/taste score: 5/i)).toBeInTheDocument()
    expect(screen.getByText(/winner mock-track-2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /song lab/i }))
    await user.click(screen.getByRole('button', { name: /open song lab/i }))

    expect(screen.getByRole('heading', { name: /song lab/i })).toBeInTheDocument()
    expect(screen.getByText(/source track: mock-track-2/i)).toBeInTheDocument()
    expect(screen.getByText(/full mix source/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /lock hook region/i }))
    await user.click(screen.getByRole('button', { name: /queue replace section/i }))

    expect(screen.getByText(/hook locked/i)).toBeInTheDocument()
    expect(screen.getByText(/songlab-edit-1 queued/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save selected to local library/i }))

    expect(screen.getByRole('heading', { name: /local library/i })).toBeInTheDocument()
    expect(screen.getAllByText(/provider library api unsupported/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/mock-track-2 saved locally/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /run api action create song/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/create song/i)
    await user.click(screen.getByRole('button', { name: /run api action library list\/search/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/library list\/search/i)

    await user.click(screen.getByRole('button', { name: /job queue/i }))

    expect(screen.getByRole('heading', { name: /job queue/i })).toBeInTheDocument()
    expect(screen.getAllByText(/create song completed/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/library list\/search unsupported/i).length).toBeGreaterThan(0)
  })

  it('surfaces source assets and persona references as provider-bound project evidence', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /source assets: 2 assets/i }))

    expect(screen.getByRole('heading', { name: /project asset library/i })).toBeInTheDocument()
    expect(screen.getByText(/asset-lyrics-draft available/i)).toBeInTheDocument()
    expect(screen.getByText(/asset-persona-seed available/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /import reference audio/i }))
    expect(await screen.findByText(/asset-reference-audio-3 blocked/i)).toBeInTheDocument()
    expect(screen.getByText(/uploadReferenceAudio blocked/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generate cover art asset/i }))
    expect(await screen.findByText(/asset-cover-art-4 blocked/i)).toBeInTheDocument()
    expect(screen.getByText(/generateCoverArt blocked/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /plan video reference/i }))
    expect(await screen.findByText(/asset-video-reference-5 blocked/i)).toBeInTheDocument()
    expect(screen.getByText(/renderMusicVideo blocked/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /voice \/ persona/i }))
    expect(screen.getByRole('heading', { name: /persona workbench/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /create persona reference/i }))
    expect(await screen.findByText(/consented bright tenor persona blocked/i)).toBeInTheDocument()
    expect(screen.getAllByText(/consent note: reusable vocal identity/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /dark cinematic lift v2/i }))
    await user.click(screen.getByRole('button', { name: /open song lab/i }))

    expect(screen.getByText(/source assets: asset-lyrics-draft/i)).toHaveTextContent(/asset-cover-art-4/i)
    expect(screen.getByText(/source assets: asset-lyrics-draft/i)).toHaveTextContent(/asset-video-reference-5/i)

    await user.click(screen.getByRole('button', { name: /open music video lane/i }))
    expect(screen.getByText(/source assets: asset-lyrics-draft/i)).toHaveTextContent(/asset-cover-art-4/i)
    await user.click(screen.getByRole('button', { name: /plan comfyui render graph/i }))
    expect(screen.getByText(/Reference assets/i)).toHaveTextContent(/asset-cover-art-4/i)
  })

  it('surfaces provider polling and export downloads as durable project assets', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /dark cinematic lift v2/i }))
    await user.click(screen.getByRole('button', { name: /downloads \/ exports/i }))

    expect(screen.getByRole('heading', { name: /provider export manager/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /poll selected generation job/i }))

    expect(screen.getByText(/Get music generation details ready/i)).toBeInTheDocument()
    expect(screen.getByText(/audio ready/i)).toBeInTheDocument()
    expect(screen.getByText(/cover-art ready/i)).toBeInTheDocument()
    expect(screen.getByText(/stem ready/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /source assets:/i }))
    expect(screen.getByText(/asset-generated-audio-/i)).toBeInTheDocument()
    expect(screen.getByText(/generated-audio; .*master audio/i)).toBeInTheDocument()
  })

  it('hydrates provider export state from the runtime boundary on load', async () => {
    const hydratedWorkflow = recordProviderTaskUpdate(createWorkflow({
      brief: 'Hydrated export hook',
      lyrics: 'Verse chorus',
      style: 'cinematic pop',
      voice: 'consented lead',
    }), {
      providerTaskId: 'task_hydrated',
      action: 'pollGenerationStatus',
      capability: 'Get music generation details',
      providerStatus: 'SUCCESS',
      message: 'Server persisted export state',
      outputs: [
        {
          kind: 'audio',
          label: 'Hydrated master audio',
          url: 'local-export://hydrated/master.mp3',
        },
      ],
      receiptId: 'poll-task-hydrated',
    })
    const exportRuntime: ProviderExportRuntimeClient = {
      async hydrate() {
        return {
          projectId: 'default-project',
          projectAssets: hydratedWorkflow.projectAssets,
          exports: hydratedWorkflow.exports,
          jobQueue: hydratedWorkflow.jobQueue,
          provenance: hydratedWorkflow.provenance,
        }
      },
      async pollGenerationTask() {
        throw new Error('poll not used')
      },
      async receiveFailedCallback() {
        throw new Error('callback not used')
      },
      async recordProviderVideoOutput() {
        throw new Error('video not used')
      },
    }
    const user = userEvent.setup()

    render(<App exportRuntime={exportRuntime} />)

    await screen.findByRole('button', { name: /downloads \/ exports: 1 provider tasks and 1 download assets/i })
    await user.click(screen.getByRole('button', { name: /downloads \/ exports/i }))

    expect(screen.getByText(/Get music generation details ready/i)).toBeInTheDocument()
    expect(screen.getByText(/audio ready/i)).toBeInTheDocument()
    expect(screen.getByText(/Hydrated master audio/i)).toBeInTheDocument()
  })

  it('hydrates a recent project with full workflow and release state on load', async () => {
    const user = userEvent.setup()
    const workflow = persistedWorkflowFixture()
    const projectStore = createMemoryProjectStore([
      projectSnapshotFromState({
        projectId: 'project-hydrated',
        briefInput: persistedBrief,
        workflow,
        releasePack: toReleasePack(workflow, { includeVideo: true }),
        savedAt: '2026-05-20T10:00:00.000Z',
      }),
    ])

    render(<App projectId="project-hydrated" projectStore={projectStore} />)

    expect((await screen.findAllByText(/Current project: project-hydrated/i)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/Hydrated khaliji hook/i)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /release pack: audio, video/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /song lab/i }))
    expect(screen.getByText(/source track: hydrated-track-2/i)).toBeInTheDocument()
    expect(screen.getByText(/hook locked/i)).toBeInTheDocument()
    expect(screen.getByText(/songlab-edit-1 queued/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: /music video lane: storyboard and lipsync qa opened from hydrated-track-2; video export ready/i,
    }))
    expect(screen.getByLabelText(/video export gate state/i)).toHaveTextContent(/video export ready/i)

    await user.click(screen.getByRole('button', { name: /downloads \/ exports/i }))
    expect(screen.getAllByText(/Hydrated export outputs/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Hydrated hook master audio/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /local library/i }))
    expect(screen.getByText(/hydrated-track-2 saved locally/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /release pack: audio, video/i }))
    expect(screen.getByText(/video included/i)).toBeInTheDocument()
    expect(screen.getByText(/cleanup applied/i)).toBeInTheDocument()
    expect(screen.getByText(/archive-1/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/apiKey|secret-key|token|bearer/i)
  })

  it('opens a different recent project without leaking the previous project state', async () => {
    const user = userEvent.setup()
    const projectAWorkflow = persistedWorkflowFixture('project-a')
    const projectBWorkflow = persistedWorkflowFixture('project-b')
    const baseProjectStore = createMemoryProjectStore([
      projectSnapshotFromState({
        projectId: 'project-a',
        briefInput: { ...persistedBrief, brief: 'Project A hook' },
        workflow: { ...projectAWorkflow, brief: 'Project A hook' },
        releasePack: toReleasePack(projectAWorkflow, { includeVideo: true }),
        savedAt: '2026-05-20T09:00:00.000Z',
      }),
      projectSnapshotFromState({
        projectId: 'project-b',
        briefInput: { ...persistedBrief, brief: 'Project B hook' },
        workflow: { ...projectBWorkflow, brief: 'Project B hook' },
        releasePack: toReleasePack(projectBWorkflow, { includeVideo: true }),
        savedAt: '2026-05-20T10:00:00.000Z',
      }),
    ])
    const savedSnapshots: ProjectWorkflowSnapshot[] = []
    const projectStore: ProjectStore = {
      loadProject: baseProjectStore.loadProject,
      listProjects: baseProjectStore.listProjects,
      async saveProject(snapshot) {
        savedSnapshots.push(snapshot)
        return baseProjectStore.saveProject(snapshot)
      },
    }
    const rejectingProvider: SunoProvider = {
      async generateBatch() {
        throw new Error('generation not used')
      },
      async executeAction() {
        throw new Error('Project A action failed')
      },
    }

    render(<App projectId="project-a" projectStore={projectStore} provider={rejectingProvider} />)

    await user.click(await screen.findByRole('button', { name: /open project lobby/i }))
    const recentProjects = screen.getByLabelText(/recent projects/i)
    expect(within(recentProjects).getByText(/Project A hook/i)).toBeInTheDocument()
    expect(within(recentProjects).getByText(/Project B hook/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /run api action create song/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/Project A action failed/i)

    await user.click(within(recentProjects).getByRole('button', { name: /Project B hook/i }))

    expect((await screen.findAllByText(/Current project: project-b/i)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /hydrated hook take 2 selected as audio source of truth \(project-b-track-2\)/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', {
      name: /hydrated hook take 2 selected as audio source of truth \(project-a-track-2\)/i,
    })).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(savedSnapshots.some((snapshot) =>
      snapshot.projectId === 'project-b' && snapshot.workflow.selectedTrack?.id === 'project-a-track-2',
    )).toBe(false)
  })

  it('surfaces provider export hydrate failures as visible runtime errors', async () => {
    const exportRuntime: ProviderExportRuntimeClient = {
      async hydrate() {
        throw new Error('Export hydrate route down')
      },
      async pollGenerationTask() {
        throw new Error('poll not used')
      },
      async receiveFailedCallback() {
        throw new Error('callback not used')
      },
      async recordProviderVideoOutput() {
        throw new Error('video not used')
      },
    }

    render(<App exportRuntime={exportRuntime} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/export hydrate route down/i)
  })

  it('surfaces provider export action failures without dropping the user on a silent button click', async () => {
    const exportRuntime: ProviderExportRuntimeClient = {
      async hydrate() {
        return null
      },
      async pollGenerationTask() {
        throw new Error('Export poll route down')
      },
      async receiveFailedCallback() {
        throw new Error('callback not used')
      },
      async recordProviderVideoOutput() {
        throw new Error('video not used')
      },
    }
    const user = userEvent.setup()

    render(<App exportRuntime={exportRuntime} />)

    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /dark cinematic lift v2/i }))
    await user.click(screen.getByRole('button', { name: /downloads \/ exports/i }))
    await user.click(screen.getByRole('button', { name: /poll selected generation job/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/export poll route down/i)
    expect(screen.getByRole('heading', { name: /provider export manager/i })).toBeInTheDocument()
  })

  it('shows unsupported provider capabilities as explicit action results', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /run api action library list\/search/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/library list\/search/i)
    expect(screen.getByRole('status')).toHaveTextContent(/unsupported/i)
  })

  it('shows a blocked API action result when a provider action rejects', async () => {
    const user = userEvent.setup()
    const rejectingProvider: SunoProvider = {
      async generateBatch() {
        throw new Error('Generation not used')
      },
      async executeAction() {
        throw new Error('Server adapter offline')
      },
    }

    render(<App provider={rejectingProvider} />)

    await user.click(screen.getByRole('button', { name: /run api action create song/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/create song/i)
    expect(screen.getByRole('status')).toHaveTextContent(/blocked/i)
    expect(screen.getByRole('status')).toHaveTextContent(/server adapter offline/i)
  })

  it('shows release pack deliverables, provenance receipts, and archive-first cleanup', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))
    await user.click(screen.getByRole('button', { name: /create audio release pack/i }))

    expect(screen.getByRole('heading', { name: /release pack/i })).toBeInTheDocument()
    expect(screen.getByText(/audio only/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /package contents/i })).toBeInTheDocument()
    expect(screen.getByText(/master audio/i)).toBeInTheDocument()
    expect(screen.getByText(/release metadata/i)).toBeInTheDocument()
    expect(screen.getByText(/prompt and lyric inputs/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /provenance receipts/i })).toBeInTheDocument()
    expect(screen.getByText(/source-track-locked/i)).toBeInTheDocument()
    expect(screen.getByText(/prompt-inputs-captured/i)).toBeInTheDocument()
    expect(screen.getByText(/release-pack-created/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /plan archive-first cleanup/i }))

    expect(screen.getByText(/cleanup archived/i)).toBeInTheDocument()
    expect(screen.getByText(/archive-1/i)).toBeInTheDocument()
    expect(screen.getAllByText(/mock-track-1/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/discard unselected generated takes/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /apply cleanup/i }))

    expect(screen.getByText(/cleanup applied/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /neon khaliji club hook v1/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /restore archived tracks/i }))

    expect(screen.getByText(/cleanup restored/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neon khaliji club hook v1/i })).toBeInTheDocument()
  })

  it('keeps an audio release pack when blocked video export fails', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))
    await user.click(screen.getByRole('button', { name: /create audio release pack/i }))

    expect(screen.getByText(/audio only/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open music video lane/i }))
    await user.click(screen.getByRole('button', { name: /create video release pack/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/blocked until lipsync qa passes/i)
    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /release pack: audio/i }))

    expect(screen.getByText(/audio only/i)).toBeInTheDocument()
    expect(screen.getByText(/master audio/i)).toBeInTheDocument()
  })

  it('keeps completed video and release state when reselecting the chosen generated track', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))
    await user.click(screen.getByRole('button', { name: /open music video lane/i }))
    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))
    await user.click(screen.getByRole('button', { name: /queue repair pass/i }))
    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))
    await user.click(screen.getByRole('button', { name: /create video release pack/i }))

    expect(screen.getByText(/video included/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generated track mock-track-2/i }))
    await user.click(
      screen.getByRole('button', {
        name: /storyboard and lipsync qa opened from mock-track-2; video export ready/i,
      }),
    )

    expect(screen.getByLabelText(/video export gate state/i)).toHaveTextContent(/video export ready/i)
    expect(screen.getByRole('button', { name: /release pack: audio, video/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /release pack: audio, video/i }))

    expect(screen.getByText(/video included/i)).toBeInTheDocument()
    expect(screen.getByText(/lipsync-approved video/i)).toBeInTheDocument()
  })

  it('locks prompt and generation controls while the music video lane is open', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))
    await user.click(screen.getByRole('button', { name: /open music video lane/i }))

    expect(screen.getByLabelText(/brief/i, { selector: 'textarea' })).toBeDisabled()
    expect(screen.getByLabelText(/lyrics/i, { selector: 'textarea' })).toBeDisabled()
    expect(screen.getByLabelText(/style/i, { selector: 'input' })).toBeDisabled()
    expect(screen.getByLabelText(/voice/i, { selector: 'input' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /run generation/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /generate suno batch/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))

    expect(screen.getByRole('heading', { name: /perfect lipsync gate/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/segment drift qa result/i)).toHaveTextContent(/repair required/i)
  })

  it('keeps an audio release pack through lipsync QA and repair work', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))
    await user.click(screen.getByRole('button', { name: /create audio release pack/i }))
    await user.click(screen.getByRole('button', { name: /open music video lane/i }))

    await user.click(screen.getByRole('button', { name: /run lipsync qa/i }))

    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /queue repair pass/i }))

    expect(screen.getByRole('button', { name: /release pack: audio/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /release pack: audio/i }))

    expect(screen.getByText(/audio only/i)).toBeInTheDocument()
    expect(screen.getByText(/master audio/i)).toBeInTheDocument()
  })

  it('clears stale generated tracks and video selection when the brief changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))

    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeEnabled()

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Fresh hook')

    expect(screen.queryByRole('button', { name: /neon khaliji club hook v1/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /neon khaliji club hook v2/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /chosen track/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeDisabled()
  })

  it('disables every generation entry point while provider work is in flight', async () => {
    const user = userEvent.setup()
    let resolveBatch: (batch: GenerationBatch) => void = () => {
      throw new Error('Slow provider was not called')
    }
    const slowProvider: SunoProvider = {
      generateBatch() {
        return new Promise<GenerationBatch>((resolve) => {
          resolveBatch = resolve
        })
      },
    }

    render(<App provider={slowProvider} />)

    await user.click(screen.getByRole('button', { name: /run generation/i }))

    expect(screen.getByRole('button', { name: /run generation/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /generate suno batch/i })).toBeDisabled()
    expect(screen.getByLabelText(/brief/i, { selector: 'textarea' })).toBeDisabled()
    expect(screen.getByLabelText(/lyrics/i, { selector: 'textarea' })).toBeDisabled()
    expect(screen.getByLabelText(/style/i, { selector: 'input' })).toBeDisabled()
    expect(screen.getByLabelText(/voice/i, { selector: 'input' })).toBeDisabled()

    resolveBatch({
      providerJobId: 'slow-provider',
      tracks: [{ id: 'slow-track-1', title: 'Slow provider v1', durationSeconds: 150 }],
    })

    expect(await screen.findByRole('button', { name: /slow provider v1/i })).toBeInTheDocument()
  })
})
