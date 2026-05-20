import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  recordProviderCallback,
  recordProviderTaskUpdate,
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
  return {
    async load(projectId) {
      const records = await readFileRecords(filePath)
      return records[projectId] ? cloneSnapshot(records[projectId]) : null
    },
    async save(projectId, state) {
      const records = await readFileRecords(filePath)
      const saved = cloneSnapshot({ ...state, projectId })
      records[projectId] = saved
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
      return cloneSnapshot(saved)
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

    async hydrateProviderExports(projectId) {
      return store.load(projectId)
    },
  }
}

async function readFileRecords(filePath: string): Promise<Record<string, ProviderExportSnapshot>> {
  try {
    const text = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(text) as unknown
    return isSnapshotRecord(parsed) ? parsed : {}
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

function cloneSnapshot(state: ProviderExportSnapshot): ProviderExportSnapshot {
  return JSON.parse(JSON.stringify(state)) as ProviderExportSnapshot
}

function isSnapshotRecord(value: unknown): value is Record<string, ProviderExportSnapshot> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
