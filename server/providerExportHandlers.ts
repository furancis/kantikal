import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  failedLipsyncChecks,
  recordProviderCallback,
  recordProviderTaskUpdate,
  type ProviderTaskOutput,
  type SunoWorkflow,
} from '../src/domain/workflow'
import {
  exportSnapshotFromWorkflow,
  mergeProviderExportSnapshot,
  type ProviderExportSnapshot,
} from '../src/api/exportState'
import type { SunoApiServerAdapter } from './sunoApiAdapter'
import { normalizeProviderCallback } from './sunoApiAdapter'

export type ProviderExportStore = {
  load(projectId: string): Promise<ProviderExportSnapshot | null>
  save(projectId: string, state: ProviderExportSnapshot): Promise<ProviderExportSnapshot>
}

export type ProviderExportHandlers = {
  pollProviderTask(input: ProviderPollHandlerInput): Promise<ProviderExportHandlerResult>
  receiveProviderCallback(input: ProviderCallbackHandlerInput): Promise<ProviderExportHandlerResult>
  recordProviderVideoOutput(input: ProviderVideoOutputHandlerInput): Promise<ProviderExportHandlerResult>
  hydrateProviderExports(projectId: string): Promise<ProviderExportSnapshot | null>
}

export type ProviderPollHandlerInput = {
  projectId: string
  workflow: SunoWorkflow
  providerTaskId: string
  action: string
  capability: string
  receiptId: string
}

export type ProviderCallbackHandlerInput = {
  projectId: string
  workflow: SunoWorkflow
  body: unknown
  action: string
  capability: string
  receiptId: string
}

export type ProviderVideoOutputHandlerInput = {
  projectId: string
  workflow: SunoWorkflow
}

export type ProviderExportHandlerResult = {
  projectId: string
  workflow: SunoWorkflow
  state: ProviderExportSnapshot
}

export function createMemoryProviderExportStore(
  initialState: ProviderExportSnapshot[] = [],
): ProviderExportStore {
  const records = new Map(initialState.map((state) => [state.projectId, cloneSnapshot(state)]))

  return {
    async load(projectId) {
      const state = records.get(projectId)
      return state ? cloneSnapshot(state) : null
    },
    async save(projectId, state) {
      const saved = cloneSnapshot({ ...state, projectId })
      records.set(projectId, saved)
      return cloneSnapshot(saved)
    },
  }
}

export function createFileProviderExportStore(filePath: string): ProviderExportStore {
  let writeQueue: Promise<unknown> = Promise.resolve()
  let writeId = 0

  function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const next = writeQueue.then(operation, operation)
    writeQueue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  return {
    async load(projectId) {
      await writeQueue
      const records = await readFileRecords(filePath)
      return records[projectId] ? cloneSnapshot(records[projectId]) : null
    },
    async save(projectId, state) {
      return enqueueWrite(async () => {
        const records = await readFileRecords(filePath)
        const saved = cloneSnapshot({ ...state, projectId })
        records[projectId] = saved
        await writeFileRecords(filePath, records, writeId)
        writeId += 1
        return cloneSnapshot(saved)
      })
    },
  }
}

export function createProviderExportHandlers(input: {
  adapter: SunoApiServerAdapter
  store: ProviderExportStore
}): ProviderExportHandlers {
  const { adapter, store } = input

  async function persist(projectId: string, workflow: SunoWorkflow): Promise<ProviderExportHandlerResult> {
    const state = await store.save(projectId, exportSnapshotFromWorkflow(projectId, workflow))
    return { projectId, workflow, state }
  }

  async function workflowWithStoredState(projectId: string, workflow: SunoWorkflow): Promise<SunoWorkflow> {
    return mergeProviderExportSnapshot(workflow, await store.load(projectId))
  }

  return {
    async pollProviderTask(request) {
      const workflow = await workflowWithStoredState(request.projectId, request.workflow)
      const update = await adapter.pollProviderTask({
        providerTaskId: request.providerTaskId,
        action: request.action,
        capability: request.capability,
        receiptId: request.receiptId,
      })
      return persist(request.projectId, recordProviderTaskUpdate(workflow, update))
    },

    async receiveProviderCallback(request) {
      const workflow = await workflowWithStoredState(request.projectId, request.workflow)
      const callback = normalizeProviderCallback(request.body, {
        action: request.action,
        capability: request.capability,
        receiptId: request.receiptId,
      })
      return persist(request.projectId, recordProviderCallback(workflow, callback))
    },

    async recordProviderVideoOutput(request) {
      const workflow = await workflowWithStoredState(request.projectId, request.workflow)
      const lane = workflow.musicVideoLane
      if (!lane) {
        return persist(request.projectId, workflow)
      }

      if (!lane.lipsync || lane.exportStatus !== 'ready' || failedLipsyncChecks(lane.lipsync).length > 0) {
        return persist(
          request.projectId,
          recordProviderTaskUpdate(workflow, {
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

      return persist(
        request.projectId,
        recordProviderTaskUpdate(workflow, {
          providerTaskId: `video-${lane.sourceTrackId}`,
          action: 'createProviderMusicVideo',
          capability: 'Provider music video creation',
          providerStatus: 'FAILED',
          message: 'Provider video output requires a real provider callback or worker output URL',
          outputs: [] satisfies ProviderTaskOutput[],
          receiptId: `video-${lane.sourceTrackId}`,
        }),
      )
    },

    async hydrateProviderExports(projectId) {
      return store.load(projectId)
    },
  }
}

async function readFileRecords(filePath: string): Promise<Record<string, ProviderExportSnapshot>> {
  try {
    const text = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(text) as unknown
    if (!isPlainObject(parsed)) {
      return {}
    }

    const records: Record<string, ProviderExportSnapshot> = {}
    for (const [projectId, snapshot] of Object.entries(parsed)) {
      if (isProviderExportSnapshot(snapshot)) {
        records[projectId] = cloneSnapshot(snapshot)
      }
    }
    return records
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function writeFileRecords(
  filePath: string,
  records: Record<string, ProviderExportSnapshot>,
  writeId: number,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${writeId}.tmp`
  await writeFile(tempPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

function cloneSnapshot(state: ProviderExportSnapshot): ProviderExportSnapshot {
  return JSON.parse(JSON.stringify(state)) as ProviderExportSnapshot
}

function isProviderExportSnapshot(value: unknown): value is ProviderExportSnapshot {
  return (
    isPlainObject(value) &&
    typeof value.projectId === 'string' &&
    isProjectAssets(value.projectAssets) &&
    isExportState(value.exports) &&
    Array.isArray(value.jobQueue) &&
    Array.isArray(value.provenance) &&
    value.provenance.every((entry) => typeof entry === 'string')
  )
}

function isProjectAssets(value: unknown): value is ProviderExportSnapshot['projectAssets'] {
  return isPlainObject(value) && Array.isArray(value.items) && Array.isArray(value.imports)
}

function isExportState(value: unknown): value is ProviderExportSnapshot['exports'] {
  return (
    isPlainObject(value) &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.downloads) &&
    Array.isArray(value.callbacks)
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
