import type {
  LipsyncChecks,
  LipsyncEvaluatorEvidence,
  LipsyncFailureRange,
  MusicVideoLane,
} from '../domain/workflow'

export const passingLipsyncChecks: LipsyncChecks = {
  phoneme: true,
  frame: true,
  mouthShape: true,
  segmentDrift: true,
  postStitch: true,
}

export function createLipsyncEvaluatorEvidence(
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
    metrics:
      failureRanges.length > 0
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
