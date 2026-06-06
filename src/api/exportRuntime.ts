import {
  isPerfectLipsyncApproved,
  recordProviderCallback,
  recordProviderTaskUpdate,
  type ProviderTaskOutput,
  type providerWorkflow,
} from '../domain/workflow'
import {
  exportSnapshotFromWorkflow,
  mergeProviderExportSnapshot,
  type ProviderExportSnapshot,
} from './exportState'

export type ProviderExportRuntimeInput = {
  projectId: string
  workflow: providerWorkflow
}

export type ProviderExportRuntimeClient = {
  hydrate(projectId: string): Promise<ProviderExportSnapshot | null>
  pollGenerationTask(input: ProviderExportRuntimeInput): Promise<ProviderExportSnapshot>
  receiveFailedCallback(input: ProviderExportRuntimeInput): Promise<ProviderExportSnapshot>
  recordProviderVideoOutput(input: ProviderExportRuntimeInput): Promise<ProviderExportSnapshot>
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type ProviderExportFetchRuntimeInput = {
  baseUrl?: string
  fetchImpl?: FetchLike
  fallback?: ProviderExportRuntimeClient
}

export function createFetchProviderExportRuntimeClient(
  input: ProviderExportFetchRuntimeInput = {},
): ProviderExportRuntimeClient {
  const fetchImpl = input.fetchImpl ?? fetch
  const fallback = input.fallback

  async function requestRoute<T>(
    projectId: string,
    path: string,
    init: RequestInit,
    fallbackAction: (() => Promise<T>) | undefined,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetchImpl(providerExportRoute(input.baseUrl, projectId, path), init)
    } catch (error) {
      if (fallbackAction) {
        return fallbackAction()
      }
      throw new Error(`Provider export route unavailable: ${errorMessage(error)}`, { cause: error })
    }

    if (response.status === 404) {
      if (fallbackAction) {
        return fallbackAction()
      }
      throw new Error('Provider export route unavailable: HTTP 404')
    }

    const payload = await readRoutePayload(response)
    if (!response.ok) {
      throw new Error(stringFrom(payload.error) ?? `Provider export route failed with HTTP ${response.status}`)
    }
    if (!('state' in payload)) {
      throw new Error('Provider export route returned no state')
    }
    return payload.state as T
  }

  return {
    async hydrate(projectId) {
      return requestRoute(projectId, '', { method: 'GET' }, fallback ? () => fallback.hydrate(projectId) : undefined)
    },

    async pollGenerationTask(request) {
      return requestRoute(
        request.projectId,
        'poll-generation-task',
        jsonRequest({ workflow: request.workflow }),
        fallback ? () => fallback.pollGenerationTask(request) : undefined,
      )
    },

    async receiveFailedCallback(request) {
      return requestRoute(
        request.projectId,
        'callback',
        jsonRequest({ workflow: request.workflow }),
        fallback ? () => fallback.receiveFailedCallback(request) : undefined,
      )
    },

    async recordProviderVideoOutput(request) {
      return requestRoute(
        request.projectId,
        'video-output',
        jsonRequest({ workflow: request.workflow }),
        fallback ? () => fallback.recordProviderVideoOutput(request) : undefined,
      )
    },
  }
}

export function createLocalProviderExportRuntimeClient(
  initialSnapshots: ProviderExportSnapshot[] = [],
): ProviderExportRuntimeClient {
  const snapshots = new Map(initialSnapshots.map((snapshot) => [snapshot.projectId, snapshot]))

  function save(projectId: string, workflow: providerWorkflow): ProviderExportSnapshot {
    const snapshot = exportSnapshotFromWorkflow(projectId, workflow)
    snapshots.set(projectId, snapshot)
    return snapshot
  }

  function workflowWithSnapshot(projectId: string, workflow: providerWorkflow): providerWorkflow {
    return mergeProviderExportSnapshot(workflow, snapshots.get(projectId))
  }

  return {
    async hydrate(projectId) {
      return snapshots.get(projectId) ?? null
    },

    async pollGenerationTask({ projectId, workflow }) {
      const current = workflowWithSnapshot(projectId, workflow)
      const sourceTrack = current.selectedTrack ?? current.generationBatch?.tracks[0]
      if (!current.generationBatch || !sourceTrack) {
        return save(projectId, current)
      }

      const outputs: ProviderTaskOutput[] = [
        {
          kind: 'audio',
          label: `${sourceTrack.title} master audio`,
          url: `local-export://${sourceTrack.id}/master.mp3`,
          sourceTrackId: sourceTrack.id,
        },
        {
          kind: 'cover-art',
          label: `${sourceTrack.title} cover art`,
          url: `local-export://${sourceTrack.id}/cover.jpeg`,
          sourceTrackId: sourceTrack.id,
        },
        {
          kind: 'stem',
          label: `${sourceTrack.title} vocals stem`,
          url: `local-export://${sourceTrack.id}/vocals.mp3`,
          sourceTrackId: sourceTrack.id,
          stemName: 'vocals',
        },
      ]

      return save(
        projectId,
        recordProviderTaskUpdate(current, {
          providerTaskId: current.generationBatch.providerJobId,
          action: 'pollGenerationStatus',
          capability: 'Get music generation details',
          providerStatus: 'SUCCESS',
          message: 'Mock record-info poll produced local downloadable outputs',
          outputs,
          receiptId: `poll-${current.generationBatch.providerJobId}`,
        }),
      )
    },

    async receiveFailedCallback({ projectId, workflow }) {
      const current = workflowWithSnapshot(projectId, workflow)
      if (!current.generationBatch) {
        return save(projectId, current)
      }

      return save(
        projectId,
        recordProviderCallback(current, {
          providerTaskId: current.generationBatch.providerJobId,
          action: 'handleProviderCallback',
          capability: 'Webhooks/retries',
          callbackType: 'complete',
          code: 451,
          providerStatus: 'FAILED',
          message: 'Provider callback reported file download failure',
          outputs: [],
          receiptId: `callback-${current.generationBatch.providerJobId}`,
        }),
      )
    },

    async recordProviderVideoOutput({ projectId, workflow }) {
      const current = workflowWithSnapshot(projectId, workflow)
      const lane = current.musicVideoLane
      if (!lane) {
        return save(projectId, current)
      }

      if (!isPerfectLipsyncApproved(lane)) {
        return save(
          projectId,
          recordProviderTaskUpdate(current, {
            providerTaskId: `video-${lane.sourceTrackId}`,
            action: 'createProviderMusicVideo',
            capability: 'Provider music video creation',
            providerStatus: 'FAILED',
            message: 'Provider video output blocked until perfect lipsync QA passes',
            outputs: [],
            receiptId: `video-${lane.sourceTrackId}`,
          }),
        )
      }

      return save(
        projectId,
        recordProviderTaskUpdate(current, {
          providerTaskId: `video-${lane.sourceTrackId}`,
          action: 'createProviderMusicVideo',
          capability: 'Provider music video creation',
          providerStatus: 'SUCCESS',
          message: 'Provider video output received',
          outputs: [
            {
              kind: 'video',
              label: `${lane.sourceTrackId} provider video`,
              url: `local-export://${lane.sourceTrackId}/video.mp4`,
              sourceTrackId: lane.sourceTrackId,
            },
          ],
          receiptId: `video-${lane.sourceTrackId}`,
        }),
      )
    },
  }
}

function providerExportRoute(baseUrl: string | undefined, projectId: string, path: string): string {
  const prefix = `${(baseUrl ?? '').replace(/\/$/, '')}/api/provider-exports/${encodeURIComponent(projectId)}`
  return path ? `${prefix}/${path}` : prefix
}

function jsonRequest(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function readRoutePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) {
    return {}
  }
  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    throw new Error('Provider export route returned invalid JSON')
  }
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
