import { isPerfectLipsyncApproved, type BriefInput, type ReleasePack, type providerWorkflow } from '../domain/workflow'

export type ProjectSummary = {
  projectId: string
  brief: string
  selectedTrackId: string | null
  selectedTrackTitle: string | null
  stage: providerWorkflow['stage']
  jobCount: number
  exportCount: number
  blockedGateCount: number
  releasePackLabel: string
  savedAt: string
}

export type ProjectWorkflowSnapshot = {
  projectId: string
  briefInput: BriefInput
  workflow: providerWorkflow
  releasePack: ReleasePack | null
  savedAt: string
}

export type ProjectStore = {
  loadProject(projectId: string): Promise<ProjectWorkflowSnapshot | null>
  saveProject(snapshot: ProjectWorkflowSnapshot): Promise<ProjectSummary>
  listProjects(): Promise<ProjectSummary[]>
}

type ProjectRecordFile = {
  snapshots: Record<string, ProjectWorkflowSnapshot>
}

type BrowserStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type FetchProjectStoreInput = {
  baseUrl?: string
  fetchImpl?: FetchLike
}

const projectStorageKey = 'kantikal.projects.v1'
const credentialKeyPattern = /(api.?key|secret|token|authorization|bearer|password|credential)/i
const credentialValuePattern = /(bearer\s+[a-z0-9+/=._-]+|sk-[a-z0-9]{20,}|ghp_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,}|server-secret|provider-token)/i

export function projectSnapshotFromState(input: {
  projectId: string
  briefInput: BriefInput
  workflow: providerWorkflow
  releasePack: ReleasePack | null
  savedAt?: string
}): ProjectWorkflowSnapshot {
  return sanitizeProjectSnapshot({
    projectId: input.projectId,
    briefInput: input.briefInput,
    workflow: input.workflow,
    releasePack: input.releasePack,
    savedAt: input.savedAt ?? new Date().toISOString(),
  })
}

export function summarizeProject(snapshot: ProjectWorkflowSnapshot): ProjectSummary {
  const workflow = snapshot.workflow
  return {
    projectId: snapshot.projectId,
    brief: workflow.brief || snapshot.briefInput.brief,
    selectedTrackId: workflow.selectedTrack?.id ?? null,
    selectedTrackTitle: workflow.selectedTrack?.title ?? null,
    stage: workflow.stage,
    jobCount: workflow.jobQueue.length,
    exportCount: workflow.exports.downloads.length,
    blockedGateCount: blockedGateCount(workflow),
    releasePackLabel: releasePackLabel(snapshot.releasePack),
    savedAt: snapshot.savedAt,
  }
}

export function createMemoryProjectStore(initialSnapshots: ProjectWorkflowSnapshot[] = []): ProjectStore {
  const snapshots = new Map(initialSnapshots.map((snapshot) => {
    const safeSnapshot = sanitizeProjectSnapshot(snapshot)
    return [safeSnapshot.projectId, safeSnapshot]
  }))

  return {
    async loadProject(projectId) {
      const snapshot = snapshots.get(projectId)
      return snapshot ? clone(snapshot) : null
    },
    async saveProject(snapshot) {
      const safeSnapshot = sanitizeProjectSnapshot(snapshot)
      snapshots.set(safeSnapshot.projectId, safeSnapshot)
      return summarizeProject(safeSnapshot)
    },
    async listProjects() {
      return [...snapshots.values()]
        .map((snapshot) => summarizeProject(snapshot))
        .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    },
  }
}

export function createBrowserProjectStore(
  storage: BrowserStorageLike | null | undefined = browserLocalStorage(),
  key = projectStorageKey,
): ProjectStore {
  if (!storage) {
    return createMemoryProjectStore()
  }
  const safeStorage = storage

  function readRecords(): ProjectRecordFile {
    const text = safeStorage.getItem(key)
    if (!text) {
      return { snapshots: {} }
    }

    try {
      const parsed = JSON.parse(text) as unknown
      if (!isRecord(parsed) || !isRecord(parsed.snapshots)) {
        return { snapshots: {} }
      }

      const snapshots: Record<string, ProjectWorkflowSnapshot> = {}
      for (const [projectId, snapshot] of Object.entries(parsed.snapshots)) {
        if (isProjectWorkflowSnapshot(snapshot)) {
          snapshots[projectId] = sanitizeProjectSnapshot(snapshot)
        }
      }
      return { snapshots }
    } catch {
      return { snapshots: {} }
    }
  }

  function writeRecords(records: ProjectRecordFile): void {
    const safeSnapshots: Record<string, ProjectWorkflowSnapshot> = {}
    for (const [projectId, snapshot] of Object.entries(records.snapshots)) {
      safeSnapshots[projectId] = sanitizeProjectSnapshot({ ...snapshot, projectId })
    }
    safeStorage.setItem(key, JSON.stringify({ snapshots: safeSnapshots }))
  }

  return {
    async loadProject(projectId) {
      return readRecords().snapshots[projectId] ?? null
    },
    async saveProject(snapshot) {
      const records = readRecords()
      const safeSnapshot = sanitizeProjectSnapshot(snapshot)
      records.snapshots[safeSnapshot.projectId] = safeSnapshot
      writeRecords(records)
      return summarizeProject(safeSnapshot)
    },
    async listProjects() {
      return Object.values(readRecords().snapshots)
        .map((snapshot) => summarizeProject(snapshot))
        .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    },
  }
}

export function createFetchProjectStore(input: FetchProjectStoreInput = {}): ProjectStore {
  const fetchImpl = input.fetchImpl ?? fetch

  async function fetchProjectRoute<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await fetchImpl(projectRoute(input.baseUrl, path), init)
    } catch (error) {
      throw new Error(`Project database route unavailable: ${errorMessage(error)}`, { cause: error })
    }

    const payload = await readProjectRoutePayload(response)
    if (!response.ok) {
      throw new Error(stringFrom(payload.error) ?? `Project database route failed with HTTP ${response.status}`)
    }
    return payload as T
  }

  return {
    async loadProject(projectId) {
      const payload = await fetchProjectRoute<{ snapshot?: ProjectWorkflowSnapshot | null }>(
        encodeURIComponent(projectId),
      )
      return payload.snapshot ?? null
    },
    async saveProject(snapshot) {
      const payload = await fetchProjectRoute<{ summary?: ProjectSummary }>(
        encodeURIComponent(snapshot.projectId),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot: sanitizeProjectSnapshot(snapshot) }),
        },
      )
      if (!payload.summary) {
        throw new Error('Project database route returned no summary')
      }
      return payload.summary
    },
    async listProjects() {
      const payload = await fetchProjectRoute<{ projects?: ProjectSummary[] }>('')
      return payload.projects ?? []
    },
  }
}

function sanitizeProjectSnapshot(snapshot: ProjectWorkflowSnapshot): ProjectWorkflowSnapshot {
  const safeSnapshot = clone(stripCredentialMaterial(snapshot)) as ProjectWorkflowSnapshot
  if (safeSnapshot.workflow.musicVideoLane && !isPerfectLipsyncApproved(safeSnapshot.workflow.musicVideoLane)) {
    safeSnapshot.workflow.musicVideoLane = {
      ...safeSnapshot.workflow.musicVideoLane,
      exportStatus: 'blocked',
    }
    if (safeSnapshot.releasePack?.includesVideo) {
      safeSnapshot.releasePack = null
    }
  }
  return safeSnapshot
}

function stripCredentialMaterial(value: unknown, key = ''): unknown {
  if (credentialKeyPattern.test(key)) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripCredentialMaterial(item)).filter((item) => item !== undefined)
  }

  if (isRecord(value)) {
    const next: Record<string, unknown> = {}
    for (const [entryKey, entryValue] of Object.entries(value)) {
      const safeValue = stripCredentialMaterial(entryValue, entryKey)
      if (safeValue !== undefined) {
        next[entryKey] = safeValue
      }
    }
    return next
  }

  if (typeof value === 'string' && credentialValuePattern.test(value)) {
    return '[redacted]'
  }

  return value
}

function blockedGateCount(workflow: providerWorkflow): number {
  let count = 0
  count += workflow.jobQueue.filter((job) => job.status === 'blocked' || job.status === 'unsupported').length
  count += workflow.projectAssets.imports.filter((job) => job.status === 'blocked' || job.status === 'unsupported').length
  count += workflow.exports.tasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length
  count += workflow.exports.callbacks.filter((callback) => callback.status === 'failed').length
  if (workflow.musicVideoLane?.exportStatus === 'blocked') {
    count += 1
  }
  return count
}

function releasePackLabel(releasePack: ReleasePack | null): string {
  if (!releasePack) {
    return 'none'
  }
  return releasePack.includesVideo ? 'audio, video' : 'audio'
}

function browserLocalStorage(): BrowserStorageLike | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

function projectRoute(baseUrl: string | undefined, path: string): string {
  const prefix = `${(baseUrl ?? '').replace(/\/$/, '')}/api/projects`
  return path ? `${prefix}/${path}` : prefix
}

async function readProjectRoutePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) {
    return {}
  }
  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'fetch failed'
}

function isProjectWorkflowSnapshot(value: unknown): value is ProjectWorkflowSnapshot {
  return (
    isRecord(value) &&
    typeof value.projectId === 'string' &&
    isBriefInput(value.briefInput) &&
    isRecord(value.workflow) &&
    typeof value.savedAt === 'string' &&
    (value.releasePack === null || isRecord(value.releasePack))
  )
}

function isBriefInput(value: unknown): value is BriefInput {
  return (
    isRecord(value) &&
    typeof value.brief === 'string' &&
    typeof value.lyrics === 'string' &&
    typeof value.style === 'string' &&
    typeof value.voice === 'string'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
