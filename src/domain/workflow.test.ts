import { describe, expect, it } from 'vitest'
import {
  applyArchiveFirstCleanup,
  createWorkflow,
  evaluateLipsync,
  failedLipsyncChecks,
  openMusicVideoLane,
  planArchiveFirstCleanup,
  queueLipsyncRepair,
  restoreArchivedTracks,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
} from './workflow'

describe('Suno workflow state machine', () => {
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

    const passed = evaluateLipsync(withRepair, {
      phoneme: true,
      frame: true,
      mouthShape: true,
      segmentDrift: true,
      postStitch: true,
    })

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
