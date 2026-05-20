import { describe, expect, it } from 'vitest'
import {
  createWorkflow,
  evaluateLipsync,
  failedLipsyncChecks,
  openMusicVideoLane,
  queueLipsyncRepair,
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
