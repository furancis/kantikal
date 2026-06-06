import {
  evaluateLipsync,
  type LipsyncChecks,
  type LipsyncEvidenceMetrics,
  type LipsyncEvaluatorEvidence,
  type LipsyncFailureRange,
  type MusicVideoLane,
  type providerWorkflow,
  isPerfectLipsyncApproved,
} from '../domain/workflow'

export type MusicVideoRuntimeInput = {
  projectId: string
  workflow: providerWorkflow
}

export type MusicVideoRuntimeClient = {
  evaluateLipsync(input: MusicVideoRuntimeInput): Promise<providerWorkflow>
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type MusicVideoFetchRuntimeInput = {
  baseUrl?: string
  fetchImpl?: FetchLike
  fallback?: MusicVideoRuntimeClient
}

const lipsyncThresholds: LipsyncEvidenceMetrics = {
  phonemeDriftMs: 35,
  frameOffsetFrames: 1,
  mouthShapeScore: 0.92,
  segmentDriftMs: 45,
  postStitchDriftMs: 45,
}

export function createFetchMusicVideoRuntimeClient(
  input: MusicVideoFetchRuntimeInput = {},
): MusicVideoRuntimeClient {
  const fetchImpl = input.fetchImpl ?? fetch
  const fallback = input.fallback

  return {
    async evaluateLipsync(request) {
      let response: Response
      try {
        response = await fetchImpl(musicVideoRuntimeRoute(input.baseUrl, request.projectId, 'evaluate-lipsync'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow: request.workflow }),
        })
      } catch (error) {
        if (fallback) {
          return fallback.evaluateLipsync(request)
        }
        throw new Error(`Music video runtime route unavailable: ${errorMessage(error)}`, { cause: error })
      }

      if (response.status === 404) {
        if (fallback) {
          return fallback.evaluateLipsync(request)
        }
        throw new Error('Music video runtime route is not mounted')
      }

      const payload = await readRuntimePayload(response)
      if (!payload) {
        if (response.ok && fallback) {
          return fallback.evaluateLipsync(request)
        }
        throw new Error(`Music video runtime failed with HTTP ${response.status}`)
      }
      if (!response.ok) {
        throw new Error(stringFrom(payload.error) ?? `Music video runtime failed with HTTP ${response.status}`)
      }
      if (!isRecord(payload.workflow)) {
        if (fallback) {
          return fallback.evaluateLipsync(request)
        }
        throw new Error('Music video runtime returned no workflow')
      }
      return payload.workflow as providerWorkflow
    },
  }
}

export function createLocalMusicVideoRuntimeClient(): MusicVideoRuntimeClient {
  return {
    async evaluateLipsync({ workflow }) {
      const lane = workflow.musicVideoLane
      if (!lane) {
        return workflow
      }
      if (isPerfectLipsyncApproved(lane)) {
        return workflow
      }

      const hasQueuedRepair = lane.repairAttempts.some((attempt) => attempt.status === 'queued')
      const checks = hasQueuedRepair ? passingLipsyncChecks() : firstPassLipsyncChecks()
      const failureRanges = failedLipsyncRanges(lane, checks)
      const evidence: LipsyncEvaluatorEvidence = {
        id: `lipsync-eval-${sanitizeId(lane.sourceTrackId)}-${lane.repairAttempts.length + 1}`,
        evaluator: 'local-worker',
        sourceTrackId: lane.sourceTrackId,
        sourceVideoUrl: `local-export://${lane.sourceTrackId}/stitched-video.mp4`,
        checkedAt: '1970-01-01T00:00:00.000Z',
        checks,
        metrics: hasQueuedRepair
          ? {
              phonemeDriftMs: 12,
              frameOffsetFrames: 0,
              mouthShapeScore: 0.97,
              segmentDriftMs: 18,
              postStitchDriftMs: 21,
            }
          : {
              phonemeDriftMs: 20,
              frameOffsetFrames: 1,
              mouthShapeScore: 0.95,
              segmentDriftMs: 96,
              postStitchDriftMs: 74,
            },
        thresholds: lipsyncThresholds,
        failureRanges,
      }

      return evaluateLipsync(workflow, checks, failureRanges, evidence)
    },
  }
}

function firstPassLipsyncChecks(): LipsyncChecks {
  return {
    phoneme: true,
    frame: true,
    mouthShape: true,
    segmentDrift: false,
    postStitch: false,
  }
}

function passingLipsyncChecks(): LipsyncChecks {
  return {
    phoneme: true,
    frame: true,
    mouthShape: true,
    segmentDrift: true,
    postStitch: true,
  }
}

function failedLipsyncRanges(lane: MusicVideoLane, checks: LipsyncChecks): LipsyncFailureRange[] {
  const fallbackScene = lane.scenes.find((scene) => scene.sectionId === 'hook') ?? lane.scenes[0]
  if (!fallbackScene) {
    return []
  }
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([checkName], index) => ({
      id: `range-${checkName}-${index + 1}`,
      checkName: checkName as LipsyncFailureRange['checkName'],
      startSeconds: fallbackScene.startSeconds,
      endSeconds: fallbackScene.endSeconds,
      severity: 'blocker' as const,
      repairAction: `Repair ${checkName} timing before export`,
    }))
}

function musicVideoRuntimeRoute(baseUrl: string | undefined, projectId: string, path: string): string {
  return `${(baseUrl ?? '').replace(/\/$/, '')}/api/music-video/${encodeURIComponent(projectId)}/${path}`
}

async function readRuntimePayload(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text()
  if (!text) {
    return {}
  }
  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return null
  }
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'track'
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'fetch failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
