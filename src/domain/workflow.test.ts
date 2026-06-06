import { describe, expect, it } from 'vitest'
import { analyzeWaveformSamples, createLikedStyleWaveformFixture } from './audioAnalysis'
import {
  applyArchiveFirstCleanup,
  analyzeTrackGenealogy,
  approveTrackListeningQa,
  compareTracks,
  createLineageGenerationBrief,
  createWorkflow,
  evaluateLipsync,
  failedLipsyncChecks,
  lockSongLabRegion,
  mergeMusicVideoRuntimeWorkflow,
  openSongLab,
  openMusicVideoLane,
  planArchiveFirstCleanup,
  planComfyRenderGraph,
  recordProviderCallback,
  recordProjectAssetImport,
  recordProviderTaskUpdate,
  recordTrackAudioAnalysis,
  queueSongLabEdit,
  queueLipsyncRepair,
  queueMusicVideoRender,
  rateTrack,
  recordProviderJobResult,
  restoreArchivedTracks,
  saveSelectedTrackToLocalLibrary,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
  type LipsyncChecks,
  type LipsyncEvaluatorEvidence,
  type LipsyncFailureRange,
  type MusicVideoLane,
} from './workflow'

const passingLipsyncChecks: LipsyncChecks = {
  phoneme: true,
  frame: true,
  mouthShape: true,
  segmentDrift: true,
  postStitch: true,
}

function evaluatorEvidence(
  lane: MusicVideoLane,
  checks: LipsyncChecks = passingLipsyncChecks,
  failureRanges: LipsyncFailureRange[] = [],
): LipsyncEvaluatorEvidence {
  return {
    id: `test-lipsync-evidence-${lane.sourceTrackId}`,
    evaluator: 'local-worker',
    sourceTrackId: lane.sourceTrackId,
    sourceVideoUrl: `local-export://${lane.sourceTrackId}/stitched-video.mp4`,
    checkedAt: '1970-01-01T00:00:00.000Z',
    checks,
    metrics: failureRanges.length > 0
      ? {
          phonemeDriftMs: 20,
          frameOffsetFrames: 1,
          mouthShapeScore: 0.95,
          segmentDriftMs: 92,
          postStitchDriftMs: 70,
        }
      : {
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
    failureRanges,
  }
}

describe('provider workflow state machine', () => {
  it('moves from brief to selected track while keeping music video subordinate', () => {
    const workflow = createWorkflow({
      brief: 'Bilingual Gulf club-pop chorus with cinematic lift',
      lyrics: 'Verse / pre / chorus',
      style: 'Gulf percussion, electro-pop, polished vocal',
      voice: 'consented reusable persona',
    })

    const withBatch = submitGenerationBatch(workflow, {
      providerJobId: 'job_001',
      tracks: [
        { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
        { id: 'song_b', title: 'Night Lift B', durationSeconds: 158 },
      ],
    })

    expect(withBatch.stage).toBe('batch-ready')
    expect(withBatch.musicVideoLane).toBeNull()

    const withTrack = selectTrack(withBatch, 'song_b')
    expect(withTrack.stage).toBe('track-selected')
    expect(withTrack.selectedTrack?.id).toBe('song_b')

    const withVideo = openMusicVideoLane(withTrack)
    expect(withVideo.musicVideoLane?.sourceTrackId).toBe('song_b')
    expect(withVideo.musicVideoLane?.exportStatus).toBe('blocked')
    expect(withVideo.musicVideoLane?.repairAttempts).toEqual([])
  })

  it('blocks release video export until all lipsync checks pass', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Arabic pop hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_002',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )

    const failed = evaluateLipsync(workflow, {
      phoneme: true,
      frame: true,
      mouthShape: true,
      segmentDrift: false,
      postStitch: true,
    })

    expect(failed.musicVideoLane?.exportStatus).toBe('blocked')
    expect(failedLipsyncChecks(failed.musicVideoLane!.lipsync!)).toEqual(['segmentDrift'])
    expect(() => toReleasePack(failed, { includeVideo: true })).toThrow(/lipsync/i)

    const withRepair = queueLipsyncRepair(failed)
    expect(withRepair.musicVideoLane?.repairAttempts).toEqual([
      {
        id: 'repair-1',
        failedChecks: ['segmentDrift'],
        action: 'Repair segmentDrift',
        status: 'queued',
      },
    ])

    const passed = evaluateLipsync(
      withRepair,
      passingLipsyncChecks,
      [],
      evaluatorEvidence(withRepair.musicVideoLane!, passingLipsyncChecks),
    )

    expect(passed.musicVideoLane?.exportStatus).toBe('ready')
    expect(passed.musicVideoLane?.repairAttempts[0]?.status).toBe('applied')
    expect(toReleasePack(passed, { includeVideo: true })).toMatchObject({
      trackId: 'song_a',
      includesVideo: true,
      provenance: expect.arrayContaining([
        'brief',
        'generation-batch',
        'selected-track',
        'lipsync-repair',
        'lipsync-qa',
      ]),
    })
  })

  it('rebases async lipsync runtime results onto current workflow state without clobbering jobs', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Async lipsync hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_003',
            tracks: [{ id: 'song_async', title: 'Async Song', durationSeconds: 154 }],
          },
        ),
        'song_async',
      ),
    )
    const runtimeResult = evaluateLipsync(
      workflow,
      passingLipsyncChecks,
      [],
      evaluatorEvidence(workflow.musicVideoLane!, passingLipsyncChecks),
    )
    const currentWithJob = recordProviderJobResult(workflow, {
      action: 'generateLyrics',
      capability: 'Lyrics generation',
      outcome: 'succeeded',
      message: 'Lyrics generation completed while lipsync was running.',
      authBoundary: 'server',
      endpoint: '/api/v1/lyrics',
      providerTaskId: 'task_lyrics_async',
      receiptId: 'receipt-lyrics-async',
    })

    const merged = mergeMusicVideoRuntimeWorkflow(currentWithJob, runtimeResult)

    expect(merged.musicVideoLane?.exportStatus).toBe('ready')
    expect(merged.jobQueue).toHaveLength(1)
    expect(merged.jobQueue[0]).toMatchObject({
      action: 'generateLyrics',
      providerTaskId: 'task_lyrics_async',
    })
    expect(merged.provenance).toEqual(expect.arrayContaining(['provider-job-result', 'lipsync-qa']))
  })

  it('rejects forged ready video state without a complete lipsync proof', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Forged video state hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_forged',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )
    const forgedReady = {
      ...workflow,
      musicVideoLane: {
        ...workflow.musicVideoLane!,
        exportStatus: 'ready' as const,
        lipsync: null,
      },
    }

    expect(() => toReleasePack(forgedReady, { includeVideo: true })).toThrow(/lipsync/i)
  })

  it('opens Music Video Lane with scene cards tied to the selected song sections', () => {
    const workflow = openMusicVideoLane(
      openSongLab(
        selectTrack(
          submitGenerationBatch(
            createWorkflow({
              brief: 'Arabic pop hook',
              lyrics: 'chorus',
              style: 'pop',
              voice: 'persona',
            }),
            {
              providerJobId: 'job_012',
              tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
            },
          ),
          'song_a',
        ),
      ),
    )

    expect(workflow.musicVideoLane?.sourceTrackId).toBe('song_a')
    expect(workflow.musicVideoLane?.scenes.map((scene) => `${scene.sectionId}:${scene.startSeconds}-${scene.endSeconds}`)).toEqual([
      'intro:0-18',
      'verse:18-65',
      'hook:65-108',
      'outro:108-154',
    ])
    expect(workflow.musicVideoLane?.scenes.find((scene) => scene.sectionId === 'hook')).toMatchObject({
      id: 'scene-hook',
      mode: 'lyric',
      sourceTrackId: 'song_a',
      status: 'planned',
    })
    expect(workflow.musicVideoLane?.renderPlan).toBeNull()
  })

  it('plans and queues a ComfyUI render graph as external worker state', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Arabic pop hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_013',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )

    const planned = planComfyRenderGraph(workflow, {
      model: 'wan-video-lipsync',
      seed: 4242,
      referenceAssetIds: ['persona-ref', 'cover-ref'],
    })

    expect(planned.musicVideoLane?.renderPlan).toMatchObject({
      id: 'comfy-song_a',
      sourceTrackId: 'song_a',
      model: 'wan-video-lipsync',
      seed: 4242,
      referenceAssetIds: ['persona-ref', 'cover-ref', 'asset-lyrics-draft', 'asset-persona-seed'],
      status: 'planned',
    })
    expect(planned.musicVideoLane?.renderPlan?.nodes.map((node) => node.id)).toEqual([
      'model',
      'seed',
      'references',
      'scene-prompts',
      'output',
    ])

    const queued = queueMusicVideoRender(planned)

    expect(queued.musicVideoLane?.renderPlan?.status).toBe('queued')
    expect(queued.musicVideoLane?.workerHealth.map((worker) => `${worker.lane}:${worker.status}`)).toEqual([
      'render:blocked',
      'stitch:queued',
      'qa:queued',
    ])
    expect(queued.musicVideoLane?.workerJobs.map((job) => `${job.lane}:${job.status}`)).toEqual([
      'render:blocked',
      'stitch:queued',
      'qa:queued',
    ])
    expect(queued.provenance).toEqual(expect.arrayContaining(['comfy-render-plan', 'music-video-render-queued']))
  })

  it('records exact lipsync failure ranges and blocks export until ranges clear', () => {
    const workflow = planComfyRenderGraph(
      openMusicVideoLane(
        selectTrack(
          submitGenerationBatch(
            createWorkflow({
              brief: 'Arabic pop hook',
              lyrics: 'chorus',
              style: 'pop',
              voice: 'persona',
            }),
            {
              providerJobId: 'job_014',
              tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
            },
          ),
          'song_a',
        ),
      ),
      {
        model: 'wan-video-lipsync',
        seed: 4242,
        referenceAssetIds: ['persona-ref'],
      },
    )

    const failed = evaluateLipsync(
      workflow,
      {
        phoneme: true,
        frame: true,
        mouthShape: true,
        segmentDrift: false,
        postStitch: false,
      },
      [
        {
          id: 'range-hook-drift',
          checkName: 'segmentDrift',
          startSeconds: 65,
          endSeconds: 82,
          severity: 'blocker',
          repairAction: 'Split hook scene and retime mouth track',
        },
        {
          id: 'range-outro-stitch',
          checkName: 'postStitch',
          startSeconds: 108,
          endSeconds: 154,
          severity: 'repair',
          repairAction: 'Rerender stitched outro and re-run QA',
        },
      ],
    )

    expect(failed.musicVideoLane?.exportStatus).toBe('blocked')
    expect(failed.musicVideoLane?.failureRanges).toEqual([
      {
        id: 'range-hook-drift',
        checkName: 'segmentDrift',
        startSeconds: 65,
        endSeconds: 82,
        severity: 'blocker',
        repairAction: 'Split hook scene and retime mouth track',
      },
      {
        id: 'range-outro-stitch',
        checkName: 'postStitch',
        startSeconds: 108,
        endSeconds: 154,
        severity: 'repair',
        repairAction: 'Rerender stitched outro and re-run QA',
      },
    ])
    expect(failed.musicVideoLane?.scenes.find((scene) => scene.sectionId === 'hook')?.status).toBe('needs-repair')
    expect(() => toReleasePack(failed, { includeVideo: true })).toThrow(/lipsync/i)

    const queuedRepair = queueLipsyncRepair(failed)
    const passed = evaluateLipsync(
      queuedRepair,
      passingLipsyncChecks,
      [],
      evaluatorEvidence(queuedRepair.musicVideoLane!, passingLipsyncChecks),
    )

    expect(passed.musicVideoLane?.failureRanges).toEqual([])
    expect(passed.musicVideoLane?.exportStatus).toBe('ready')
    expect(toReleasePack(passed, { includeVideo: true }).includesVideo).toBe(true)
  })

  it('turns prompt inputs into durable project assets and voice persona state', () => {
    const workflow = createWorkflow({
      brief: 'Arabic pop hook',
      lyrics: 'chorus lyric document',
      style: 'pop',
      voice: 'consented bright tenor persona',
    })

    expect(workflow.projectAssets.items.map((asset) => `${asset.kind}:${asset.status}`)).toEqual([
      'lyrics-doc:available',
      'persona-reference:available',
    ])
    expect(workflow.projectAssets.items.find((asset) => asset.kind === 'persona-reference')).toMatchObject({
      id: 'asset-persona-seed',
      consentNote: 'consented bright tenor persona',
      authBoundary: 'none',
      sourceIds: ['voice'],
    })
    expect(workflow.voicePersonas.activePersonaId).toBe('persona-prompt')
    expect(workflow.voicePersonas.personas[0]).toMatchObject({
      assetId: 'asset-persona-seed',
      consentNote: 'consented bright tenor persona',
      providerStatus: 'available',
      tags: ['consent', 'prompt-safe'],
    })
  })

  it('records upload, cover-art, persona, and video references as provider-bound asset imports', () => {
    const workflow = createWorkflow({
      brief: 'Arabic pop hook',
      lyrics: 'chorus',
      style: 'pop',
      voice: 'consented persona',
    })

    const withReferenceAudio = recordProjectAssetImport(
      workflow,
      {
        kind: 'reference-audio',
        label: 'Hook guide reference audio',
        sourceIds: ['brief'],
        tags: ['reference', 'upload'],
      },
      {
        action: 'uploadReferenceAudio',
        capability: 'Upload/reference audio',
        outcome: 'planned',
        message: 'Upload/reference audio is mapped to a server provider action.',
        authBoundary: 'server',
        endpoint: '/api/file-url-upload',
        receiptId: 'provider-action-upload-reference-audio',
      },
    )
    const withCoverArt = recordProjectAssetImport(
      withReferenceAudio,
      {
        kind: 'cover-art',
        label: 'Release cover art direction',
        sourceIds: ['style'],
        tags: ['cover', 'release'],
      },
      {
        action: 'generateCoverArt',
        capability: 'Cover art',
        outcome: 'planned',
        message: 'Cover art waits for the server adapter lane.',
        authBoundary: 'server',
        endpoint: '/api/v1/provider/cover/generate',
        receiptId: 'provider-action-cover-art',
      },
    )
    const withPersona = recordProjectAssetImport(
      withCoverArt,
      {
        kind: 'persona-reference',
        label: 'Consented tenor persona',
        sourceIds: ['voice'],
        tags: ['consent', 'voice'],
        consentNote: 'consented persona',
      },
      {
        action: 'createCustomVoice',
        capability: 'Custom voice creation',
        outcome: 'planned',
        message: 'Custom voice creation waits for server credentials.',
        authBoundary: 'server',
        endpoint: '/api/v1/voice/generate',
        receiptId: 'provider-action-custom-voice',
      },
    )
    const withVideoReference = recordProjectAssetImport(
      withPersona,
      {
        kind: 'video-reference',
        label: 'Performance framing reference',
        sourceIds: ['brief'],
        tags: ['video', 'reference'],
      },
      {
        action: 'renderMusicVideo',
        capability: 'Render music video',
        outcome: 'blocked',
        message: 'Render music video requires an external worker lane.',
        authBoundary: 'external-worker',
        receiptId: 'provider-action-render-music-video',
      },
    )

    expect(withVideoReference.projectAssets.items.map((asset) => `${asset.kind}:${asset.status}`)).toEqual([
      'lyrics-doc:available',
      'persona-reference:planned',
      'reference-audio:planned',
      'cover-art:planned',
      'video-reference:blocked',
    ])
    expect(withVideoReference.projectAssets.imports.map((job) => `${job.action}:${job.status}:${job.authBoundary}`)).toEqual([
      'uploadReferenceAudio:planned:server',
      'generateCoverArt:planned:server',
      'createCustomVoice:planned:server',
      'renderMusicVideo:blocked:external-worker',
    ])
    expect(withVideoReference.jobQueue.map((job) => `${job.action}:${job.status}`)).toEqual([
      'uploadReferenceAudio:planned',
      'generateCoverArt:planned',
      'createCustomVoice:planned',
      'renderMusicVideo:blocked',
    ])
    expect(JSON.stringify(withVideoReference.projectAssets)).not.toContain('secret')
  })

  it('carries project asset references into Song Lab and Music Video Lane render planning', () => {
    const workflowWithAssets = recordProjectAssetImport(
      recordProjectAssetImport(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'consented persona',
        }),
        {
          kind: 'reference-audio',
          label: 'Hook guide reference audio',
          sourceIds: ['brief'],
          tags: ['reference'],
        },
        {
          action: 'uploadReferenceAudio',
          capability: 'Upload/reference audio',
          outcome: 'planned',
          message: 'planned',
          authBoundary: 'server',
          receiptId: 'provider-action-upload-reference-audio',
        },
      ),
      {
        kind: 'cover-art',
        label: 'Cover art direction',
        sourceIds: ['style'],
        tags: ['cover'],
      },
      {
        action: 'generateCoverArt',
        capability: 'Cover art',
        outcome: 'planned',
        message: 'planned',
        authBoundary: 'server',
        receiptId: 'provider-action-cover-art',
      },
    )

    const selected = selectTrack(
      submitGenerationBatch(workflowWithAssets, {
        providerJobId: 'job_015',
        tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
      }),
      'song_a',
    )
    const songLab = openSongLab(selected)
    const video = openMusicVideoLane(songLab)
    const renderPlan = planComfyRenderGraph(video, {
      model: 'wan-video-lipsync',
      seed: 4242,
      referenceAssetIds: [],
    })

    expect(songLab.songLab?.assetRefs).toEqual([
      'asset-lyrics-draft',
      'asset-persona-seed',
      'asset-reference-audio-3',
      'asset-cover-art-4',
    ])
    expect(video.musicVideoLane?.assetRefs).toEqual(songLab.songLab?.assetRefs)
    expect(video.musicVideoLane?.scenes[0].assetRefs).toEqual(
      expect.arrayContaining(['asset-reference-audio-3', 'asset-cover-art-4']),
    )
    expect(renderPlan.musicVideoLane?.renderPlan?.referenceAssetIds).toEqual(songLab.songLab?.assetRefs)
    expect(renderPlan.musicVideoLane?.renderPlan?.nodes.find((node) => node.id === 'references')?.value).toContain(
      'asset-cover-art-4',
    )
  })

  it('turns completed provider poll output into durable download assets', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Provider completion hook',
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

    const updated = recordProviderTaskUpdate(workflow, {
      providerTaskId: 'task_123',
      action: 'pollGenerationStatus',
      capability: 'Get music generation details',
      providerStatus: 'SUCCESS',
      message: 'All tracks generated successfully',
      outputs: [
        {
          kind: 'audio',
          label: 'Night Lift A master audio',
          url: 'https://cdn.example/song-a.mp3',
          sourceTrackId: 'song_a',
        },
        {
          kind: 'cover-art',
          label: 'Night Lift A cover art',
          url: 'https://cdn.example/song-a.jpeg',
          sourceTrackId: 'song_a',
        },
        {
          kind: 'stem',
          label: 'Night Lift A vocals stem',
          url: 'https://cdn.example/song-a-vocals.mp3',
          sourceTrackId: 'song_a',
          stemName: 'vocals',
        },
      ],
      receiptId: 'poll-task-123',
    })

    expect(updated.exports.tasks).toEqual([
      expect.objectContaining({
        providerTaskId: 'task_123',
        status: 'ready',
        outputAssetIds: [
          'asset-generated-audio-task-123-1',
          'asset-cover-art-task-123-2',
          'asset-stem-task-123-3',
        ],
      }),
    ])
    expect(updated.exports.downloads.map((download) => `${download.kind}:${download.status}`)).toEqual([
      'audio:ready',
      'cover-art:ready',
      'stem:ready',
    ])
    expect(updated.projectAssets.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'asset-generated-audio-task-123-1',
          kind: 'generated-audio',
          status: 'available',
          sourceIds: ['song_a', 'task_123'],
        }),
        expect.objectContaining({
          id: 'asset-stem-task-123-3',
          kind: 'stem',
          tags: ['download', 'stem', 'vocals'],
        }),
      ]),
    )
    expect(updated.provenance).toEqual(expect.arrayContaining(['provider-task-update', 'provider-download-assets']))
  })

  it('records provider callback failures without creating downloads', () => {
    const workflow = submitGenerationBatch(
      createWorkflow({
        brief: 'Callback failure hook',
        lyrics: 'Verse chorus',
        style: 'cinematic pop',
        voice: 'consented lead',
      }),
      {
        providerJobId: 'task_failed',
        tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
      },
    )

    const failed = recordProviderCallback(workflow, {
      providerTaskId: 'task_failed',
      action: 'handleProviderCallback',
      capability: 'Webhooks/retries',
      callbackType: 'complete',
      code: 451,
      providerStatus: 'FAILED',
      message: 'File download failed',
      outputs: [],
      receiptId: 'callback-task-failed',
    })

    expect(failed.exports.callbacks).toEqual([
      expect.objectContaining({
        providerTaskId: 'task_failed',
        code: 451,
        status: 'failed',
      }),
    ])
    expect(failed.exports.tasks).toEqual([
      expect.objectContaining({
        providerTaskId: 'task_failed',
        status: 'failed',
        message: 'File download failed',
      }),
    ])
    expect(failed.exports.downloads).toEqual([])
    expect(failed.jobQueue.at(-1)).toMatchObject({
      action: 'handleProviderCallback',
      status: 'blocked',
      providerTaskId: 'task_failed',
    })
  })

  it('keeps provider video downloads blocked until the perfect lipsync gate is ready', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Video callback hook',
            lyrics: 'Verse chorus',
            style: 'cinematic pop',
            voice: 'consented lead',
          }),
          {
            providerJobId: 'task_video',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )
    const videoOutput = {
      providerTaskId: 'task_video',
      action: 'createProviderMusicVideo',
      capability: 'Provider music video creation',
      providerStatus: 'SUCCESS',
      message: 'Video ready',
      outputs: [
        {
          kind: 'video' as const,
          label: 'Night Lift A provider video',
          url: 'https://cdn.example/song-a.mp4',
          sourceTrackId: 'song_a',
        },
      ],
      receiptId: 'video-task',
    }

    const blocked = recordProviderTaskUpdate(workflow, videoOutput)
    const forgedReady = recordProviderTaskUpdate(
      {
        ...workflow,
        musicVideoLane: {
          ...workflow.musicVideoLane!,
          exportStatus: 'ready' as const,
          lipsync: null,
        },
      },
      videoOutput,
    )
    expect(blocked.exports.downloads).toEqual([
      expect.objectContaining({
        kind: 'video',
        status: 'blocked',
        message: expect.stringMatching(/lipsync/i),
      }),
    ])
    expect(blocked.projectAssets.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'asset-video-output-task-video-1',
          kind: 'video-output',
          status: 'blocked',
        }),
      ]),
    )
    expect(forgedReady.exports.downloads).toEqual([
      expect.objectContaining({
        kind: 'video',
        status: 'blocked',
        message: expect.stringMatching(/lipsync/i),
      }),
    ])

    const passed = evaluateLipsync(
      workflow,
      passingLipsyncChecks,
      [],
      evaluatorEvidence(workflow.musicVideoLane!, passingLipsyncChecks),
    )
    const ready = recordProviderTaskUpdate(passed, videoOutput)

    expect(ready.exports.downloads).toEqual([
      expect.objectContaining({
        kind: 'video',
        status: 'ready',
        assetId: 'asset-video-output-task-video-1',
      }),
    ])
    expect(ready.projectAssets.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'asset-video-output-task-video-1',
          kind: 'video-output',
          status: 'available',
        }),
      ]),
    )
  })

  it('generates release pack deliverables and provenance receipts', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'persona',
        }),
        {
          providerJobId: 'job_004',
          tracks: [
            { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
            { id: 'song_b', title: 'Night Lift B', durationSeconds: 158 },
          ],
        },
      ),
      'song_b',
    )

    const releasePack = toReleasePack(workflow, { includeVideo: false })

    expect(releasePack.items.map((item) => item.kind)).toEqual([
      'audio',
      'metadata',
      'prompts',
      'provenance',
    ])
    expect(releasePack.receipts.map((receipt) => receipt.action)).toEqual([
      'source-track-locked',
      'prompt-inputs-captured',
      'release-pack-created',
    ])
    expect(releasePack.items[0]).toMatchObject({
      id: 'audio-song_b',
      label: 'Night Lift B master audio',
      sourceId: 'song_b',
    })
  })

  it('archives cleanup targets before removing discarded generated tracks', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'persona',
        }),
        {
          providerJobId: 'job_005',
          tracks: [
            { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
            { id: 'song_b', title: 'Night Lift B', durationSeconds: 158 },
          ],
        },
      ),
      'song_b',
    )

    const planned = planArchiveFirstCleanup(workflow, ['song_a'], 'discard unselected take')

    expect(planned.cleanupPlan).toMatchObject({
      id: 'cleanup-1',
      status: 'archived',
      targetTrackIds: ['song_a'],
      receiptId: 'cleanup-receipt-1',
    })
    expect(planned.archiveEntries).toEqual([
      {
        id: 'archive-1',
        track: { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
        reason: 'discard unselected take',
        receiptId: 'cleanup-receipt-1',
      },
    ])
    expect(planned.cleanupReceipts[0]).toMatchObject({
      id: 'cleanup-receipt-1',
      action: 'archive-before-cleanup',
      targetTrackIds: ['song_a'],
    })
    expect(planned.generationBatch?.tracks.map((track) => track.id)).toEqual(['song_a', 'song_b'])

    const applied = applyArchiveFirstCleanup(planned)

    expect(applied.cleanupPlan?.status).toBe('applied')
    expect(applied.generationBatch?.tracks.map((track) => track.id)).toEqual(['song_b'])
    expect(applied.cleanupReceipts.at(-1)).toMatchObject({
      action: 'cleanup-applied',
      targetTrackIds: ['song_a'],
    })

    const restored = restoreArchivedTracks(applied)

    expect(restored.cleanupPlan?.status).toBe('restored')
    expect(restored.generationBatch?.tracks.map((track) => track.id).sort()).toEqual(['song_a', 'song_b'])
    expect(restored.cleanupReceipts.at(-1)).toMatchObject({
      action: 'cleanup-restored',
      targetTrackIds: ['song_a'],
    })
  })

  it('builds Track Genealogy from prompts, assets, taste, Song Lab, archive, and release evidence', () => {
    const generated = submitGenerationBatch(
      createWorkflow({
        brief: 'Bilingual Gulf club-pop hook with dark lift',
        lyrics: 'Verse, pre, chorus, bridge with bilingual chorus',
        style: 'Gulf percussion, polished electro-pop, cinematic mix',
        voice: 'Consented warm tenor identity',
      }),
      {
        providerJobId: 'job_genealogy',
        tracks: [
          { id: 'song_a', title: 'Dark Lift A', durationSeconds: 146 },
          { id: 'song_b', title: 'Dark Lift B', durationSeconds: 154 },
          { id: 'song_c', title: 'Dark Lift C', durationSeconds: 162 },
        ],
      },
    )
    const selected = selectTrack(
      compareTracks(
        rateTrack(
          rateTrack(rateTrack(generated, 'song_a', { score: 2, notes: 'drifts away from the hook' }), 'song_b', {
            score: 5,
            notes: 'best chorus and vocal identity',
            tags: ['hook', 'vocal'],
          }),
          'song_c',
          { score: 4, notes: 'better mix direction', tags: ['mix'] },
        ),
        {
          leftTrackId: 'song_b',
          rightTrackId: 'song_c',
          winnerTrackId: 'song_b',
          notes: 'B keeps the hook; C has a useful mix direction',
        },
      ),
      'song_b',
    )
    const songLab = queueSongLabEdit(openSongLab(selected), {
      sectionId: 'hook',
      action: 'replaceSection',
      label: 'Try denser chorus lift',
    })
    const archived = planArchiveFirstCleanup(songLab, ['song_a'], 'dead branch drifted away from brief')

    const genealogy = analyzeTrackGenealogy(archived)

    expect(genealogy.sourceTrackId).toBe('song_b')
    expect(genealogy.ancestors.map((ancestor) => ancestor.id)).toEqual(
      expect.arrayContaining(['brief', 'lyrics', 'style', 'voice', 'job_genealogy', 'asset-lyrics-draft']),
    )
    expect(genealogy.descendants.map((descendant) => descendant.id)).toEqual(
      expect.arrayContaining(['song_b', 'song_c', 'songlab-edit-1']),
    )
    expect(genealogy.inheritedTraits.map((trait) => trait.trait)).toEqual(
      expect.arrayContaining(['chorus shape', 'rhythm palette', 'vocal identity', 'language mix']),
    )
    expect(genealogy.mutations.find((mutation) => mutation.trackId === 'song_c')).toMatchObject({
      changes: expect.arrayContaining(['duration +8s vs selected source']),
      inherited: expect.arrayContaining(['chorus shape', 'vocal identity']),
    })
    expect(genealogy.fitLineage[0]).toMatchObject({
      trackId: 'song_b',
      score: 5,
    })
    expect(genealogy.deadBranches).toEqual([
      expect.objectContaining({
        trackId: 'song_a',
        reason: expect.stringMatching(/drift|dead branch/i),
      }),
    ])
    expect(genealogy.breedingSuggestions[0]).toMatchObject({
      sourceTrackIds: ['song_b', 'song_c'],
    })

    const lineageBrief = createLineageGenerationBrief(archived, genealogy.breedingSuggestions[0])
    expect(lineageBrief.brief).toMatch(/combine song_b with song_c/i)
    expect(lineageBrief.style).toMatch(/lineage-guided/i)
  })

  it('feeds waveform analysis into Track Genealogy mutations, inherited traits and branch fit', () => {
    const selected = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'RT-style hard rhythmic hybrid with bilingual hook',
          lyrics: 'Verse pre chorus with hook lift',
          style: 'dynamic bass, melodic metalcore, cinematic synthpop',
          voice: 'warm custom vocal identity',
        }),
        {
          providerJobId: 'job_audio_genealogy',
          tracks: [
            { id: 'song_a', title: 'RT Signal A', durationSeconds: 154 },
            { id: 'song_b', title: 'RT Signal B', durationSeconds: 156 },
          ],
        },
      ),
      'song_a',
    )
    const analyzed = recordTrackAudioAnalysis(
      selected,
      'song_a',
      analyzeWaveformSamples(createLikedStyleWaveformFixture('song_a')),
    )

    const genealogy = analyzeTrackGenealogy(analyzed)

    expect(analyzed.audioIntelligence.tracks.song_a.fit.score).toBeGreaterThanOrEqual(4)
    expect(genealogy.ancestors.map((ancestor) => ancestor.id)).toContain('audio-intelligence-song_a')
    expect(genealogy.inheritedTraits.map((trait) => trait.trait)).toEqual(
      expect.arrayContaining(['waveform contour', 'rhythmic transient identity']),
    )
    expect(genealogy.mutations.find((mutation) => mutation.trackId === 'song_a')?.changes).toEqual(
      expect.arrayContaining([expect.stringMatching(/waveform peak .* transients/i)]),
    )
    expect(genealogy.fitLineage[0]).toMatchObject({
      trackId: 'song_a',
      why: expect.arrayContaining([expect.stringMatching(/audio: clear rhythmic transients/i)]),
    })
  })

  it('requires computed-audio evidence before a retrieved provider track can receive listening QA approval', () => {
    const selected = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Provider audio QA hook',
          lyrics: 'Verse pre chorus',
          style: 'tight dark pop',
          voice: 'consented lead',
        }),
        {
          providerJobId: 'task_qa',
          tracks: [{ id: 'task-qa-track-1', title: 'Provider QA take', durationSeconds: 151 }],
        },
      ),
      'task-qa-track-1',
    )

    expect(() =>
      approveTrackListeningQa(selected, {
        trackId: 'task-qa-track-1',
        audioAssetId: 'asset-generated-audio-task-qa-1',
        audioUrl: 'https://cdn.example/qa.mp3',
      }),
    ).toThrow(/computed-audio analysis/i)

    const analyzed = recordTrackAudioAnalysis(
      selected,
      'task-qa-track-1',
      analyzeWaveformSamples(createLikedStyleWaveformFixture('task-qa-track-1')),
    )
    const approved = approveTrackListeningQa(analyzed, {
      trackId: 'task-qa-track-1',
      audioAssetId: 'asset-generated-audio-task-qa-1',
      audioUrl: 'https://cdn.example/qa.mp3',
    })

    expect(approved.listeningQa.approvals['task-qa-track-1']).toMatchObject({
      status: 'approved',
      audioAssetId: 'asset-generated-audio-task-qa-1',
      analysisEvidenceId: 'audio-intelligence-task-qa-track-1',
    })
    expect(approved.provenance).toEqual(expect.arrayContaining(['audio-intelligence', 'listening-qa-approved']))
  })

  it('refuses to clean up the selected source track', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'persona',
        }),
        {
          providerJobId: 'job_006',
          tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
        },
      ),
      'song_a',
    )

    expect(() => planArchiveFirstCleanup(workflow, ['song_a'], 'bad cleanup')).toThrow(/selected source/i)
  })

  it('rates and compares generated versions without changing the selected source', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'persona',
        }),
        {
          providerJobId: 'job_008',
          tracks: [
            { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
            { id: 'song_b', title: 'Night Lift B', durationSeconds: 158 },
          ],
        },
      ),
      'song_a',
    )

    const rated = rateTrack(
      rateTrack(workflow, 'song_a', {
        score: 3,
        notes: 'good verse, hook lacks lift',
        tags: ['usable'],
      }),
      'song_b',
      {
        score: 5,
        notes: 'stronger hook and better drop',
        tags: ['winner', 'release-candidate'],
      },
    )

    const compared = compareTracks(rated, {
      leftTrackId: 'song_a',
      rightTrackId: 'song_b',
      winnerTrackId: 'song_b',
      notes: 'B keeps the Gulf percussion but lands the chorus faster',
    })

    expect(compared.selectedTrack?.id).toBe('song_a')
    expect(compared.taste.ratings.song_b).toMatchObject({
      trackId: 'song_b',
      score: 5,
      notes: 'stronger hook and better drop',
      tags: ['winner', 'release-candidate'],
    })
    expect(compared.taste.comparisons).toEqual([
      {
        id: 'comparison-1',
        leftTrackId: 'song_a',
        rightTrackId: 'song_b',
        winnerTrackId: 'song_b',
        notes: 'B keeps the Gulf percussion but lands the chorus faster',
      },
    ])
    expect(compared.provenance).toEqual(
      expect.arrayContaining(['selected-track', 'taste-rating', 'version-comparison']),
    )
  })

  it('opens Song Lab with section locks, stems, and queued edit actions from the selected track', () => {
    const workflow = openSongLab(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Arabic pop hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_009',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )

    expect(workflow.songLab).toMatchObject({
      sourceTrackId: 'song_a',
      status: 'open',
    })
    expect(workflow.songLab?.sections.map((section) => section.id)).toEqual([
      'intro',
      'verse',
      'hook',
      'outro',
    ])
    expect(workflow.songLab?.stems.map((stem) => `${stem.id}:${stem.status}`)).toEqual([
      'vocals:planned',
      'instrumental:planned',
      'full-mix:available',
    ])

    const locked = lockSongLabRegion(workflow, 'hook')
    const withEdit = queueSongLabEdit(locked, {
      sectionId: 'hook',
      action: 'replaceSection',
      label: 'Replace hook with cleaner bilingual lift',
    })

    expect(withEdit.songLab?.sections.find((section) => section.id === 'hook')).toMatchObject({
      id: 'hook',
      locked: true,
    })
    expect(withEdit.songLab?.editActions).toEqual([
      {
        id: 'songlab-edit-1',
        sectionId: 'hook',
        action: 'replaceSection',
        label: 'Replace hook with cleaner bilingual lift',
        status: 'queued',
      },
    ])
    expect(withEdit.provenance).toEqual(
      expect.arrayContaining(['song-lab-opened', 'song-lab-region-locked', 'song-lab-edit-queued']),
    )
  })

  it('records provider action results as queue jobs without discarding workflow evidence', () => {
    const workflow = openMusicVideoLane(
      selectTrack(
        submitGenerationBatch(
          createWorkflow({
            brief: 'Arabic pop hook',
            lyrics: 'chorus',
            style: 'pop',
            voice: 'persona',
          }),
          {
            providerJobId: 'job_010',
            tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
          },
        ),
        'song_a',
      ),
    )

    const withBlockedJob = recordProviderJobResult(workflow, {
      action: 'replaceSection',
      capability: 'Replace section',
      outcome: 'blocked',
      message: 'Server adapter offline',
      authBoundary: 'server',
      endpoint: '/api/v1/generate/replace-section',
      receiptId: 'provider-action-replace-section',
    })

    const withCompletedJob = recordProviderJobResult(withBlockedJob, {
      action: 'generateBatch',
      capability: 'Create song',
      outcome: 'succeeded',
      message: 'Mock provider completed',
      authBoundary: 'server',
      endpoint: '/api/v1/generate',
      providerTaskId: 'mock_music_hook',
      receiptId: 'provider-action-create-song',
    })

    expect(withCompletedJob.musicVideoLane?.sourceTrackId).toBe('song_a')
    expect(withCompletedJob.selectedTrack?.id).toBe('song_a')
    expect(withCompletedJob.jobQueue.map((job) => `${job.capability}:${job.status}`)).toEqual([
      'Replace section:blocked',
      'Create song:completed',
    ])
    expect(withCompletedJob.jobQueue[1]).toMatchObject({
      id: 'job-2',
      providerTaskId: 'mock_music_hook',
      receiptId: 'provider-action-create-song',
    })
  })

  it('saves selected tracks to a local library while keeping provider library unsupported', () => {
    const workflow = saveSelectedTrackToLocalLibrary(
      rateTrack(
        selectTrack(
          submitGenerationBatch(
            createWorkflow({
              brief: 'Arabic pop hook',
              lyrics: 'chorus',
              style: 'pop',
              voice: 'persona',
            }),
            {
              providerJobId: 'job_011',
              tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
            },
          ),
          'song_a',
        ),
        'song_a',
        {
          score: 5,
          notes: 'release keeper',
          tags: ['keeper'],
        },
      ),
      {
        notes: 'local project keeper, not provider library sync',
        tags: ['library', 'keeper'],
      },
    )

    expect(workflow.localLibrary.providerLibraryStatus).toBe('unsupported')
    expect(workflow.localLibrary.items).toEqual([
      {
        id: 'local-library-song_a',
        scope: 'local-project',
        track: { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
        notes: 'local project keeper, not provider library sync',
        tags: ['library', 'keeper'],
        ratingScore: 5,
      },
    ])
    expect(workflow.provenance).toEqual(expect.arrayContaining(['local-library-save']))
  })

  it('refuses to apply cleanup when archive entries are missing', () => {
    const workflow = selectTrack(
      submitGenerationBatch(
        createWorkflow({
          brief: 'Arabic pop hook',
          lyrics: 'chorus',
          style: 'pop',
          voice: 'persona',
        }),
        {
          providerJobId: 'job_007',
          tracks: [
            { id: 'song_a', title: 'Night Lift A', durationSeconds: 154 },
            { id: 'song_b', title: 'Night Lift B', durationSeconds: 158 },
          ],
        },
      ),
      'song_b',
    )

    const forgedArchivedPlan = {
      ...workflow,
      cleanupPlan: {
        id: 'cleanup-1',
        status: 'archived' as const,
        targetTrackIds: ['song_a'],
        receiptId: 'cleanup-receipt-1',
      },
    }

    expect(() => applyArchiveFirstCleanup(forgedArchivedPlan)).toThrow(/archive entries/i)
  })

  it('does not queue a repair pass without failed lipsync checks', () => {
    const workflow = evaluateLipsync(
      openMusicVideoLane(
        selectTrack(
          submitGenerationBatch(
            createWorkflow({
              brief: 'Arabic pop hook',
              lyrics: 'chorus',
              style: 'pop',
              voice: 'persona',
            }),
            {
              providerJobId: 'job_003',
              tracks: [{ id: 'song_a', title: 'Night Lift A', durationSeconds: 154 }],
            },
          ),
          'song_a',
        ),
      ),
      {
        phoneme: true,
        frame: true,
        mouthShape: true,
        segmentDrift: true,
        postStitch: true,
      },
    )

    expect(() => queueLipsyncRepair(workflow)).toThrow(/failed lipsync/i)
  })
})
