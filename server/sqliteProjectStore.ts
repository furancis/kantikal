import Database from 'better-sqlite3'
import type { ProviderExportSnapshot } from '../src/api/exportState'
import {
  projectSnapshotFromState,
  summarizeProject,
  type ProjectStore,
  type ProjectWorkflowSnapshot,
} from '../src/api/projectStore'
import type { ProviderExportStore } from './providerExportHandlers'

export type SqliteProjectDatabase = {
  close(): void
  projectStore: ProjectStore
  providerExportStore: ProviderExportStore
}

export function createSqliteProjectDatabase(filePath: string): SqliteProjectDatabase {
  const db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_snapshots (
      project_id TEXT PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS provider_export_snapshots (
      project_id TEXT PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
  `)

  const loadProjectStatement = db.prepare('SELECT snapshot_json FROM project_snapshots WHERE project_id = ?')
  const saveProjectStatement = db.prepare(`
    INSERT INTO project_snapshots (project_id, snapshot_json, saved_at)
    VALUES (@projectId, @snapshotJson, @savedAt)
    ON CONFLICT(project_id) DO UPDATE SET
      snapshot_json = excluded.snapshot_json,
      saved_at = excluded.saved_at
  `)
  const listProjectsStatement = db.prepare('SELECT snapshot_json FROM project_snapshots ORDER BY saved_at DESC')
  const loadExportStatement = db.prepare('SELECT snapshot_json FROM provider_export_snapshots WHERE project_id = ?')
  const saveExportStatement = db.prepare(`
    INSERT INTO provider_export_snapshots (project_id, snapshot_json, saved_at)
    VALUES (@projectId, @snapshotJson, @savedAt)
    ON CONFLICT(project_id) DO UPDATE SET
      snapshot_json = excluded.snapshot_json,
      saved_at = excluded.saved_at
  `)

  const projectStore: ProjectStore = {
    async loadProject(projectId) {
      return parseProjectRow(loadProjectStatement.get(projectId))
    },
    async saveProject(snapshot) {
      const safeSnapshot = projectSnapshotFromState(snapshot)
      saveProjectStatement.run({
        projectId: safeSnapshot.projectId,
        snapshotJson: JSON.stringify(safeSnapshot),
        savedAt: safeSnapshot.savedAt,
      })
      return summarizeProject(safeSnapshot)
    },
    async listProjects() {
      return listProjectsStatement
        .all()
        .map((row) => parseProjectRow(row))
        .filter((snapshot): snapshot is ProjectWorkflowSnapshot => Boolean(snapshot))
        .map((snapshot) => summarizeProject(snapshot))
    },
  }

  const providerExportStore: ProviderExportStore = {
    async load(projectId) {
      return parseExportRow(loadExportStatement.get(projectId))
    },
    async save(projectId, state) {
      const snapshot = { ...clone(state), projectId }
      saveExportStatement.run({
        projectId,
        snapshotJson: JSON.stringify(snapshot),
        savedAt: new Date().toISOString(),
      })
      return clone(snapshot)
    },
  }

  return {
    close: () => {
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
    },
    projectStore,
    providerExportStore,
  }
}

function parseProjectRow(row: unknown): ProjectWorkflowSnapshot | null {
  if (!isRecord(row) || typeof row.snapshot_json !== 'string') {
    return null
  }
  try {
    return projectSnapshotFromState(JSON.parse(row.snapshot_json) as ProjectWorkflowSnapshot)
  } catch {
    return null
  }
}

function parseExportRow(row: unknown): ProviderExportSnapshot | null {
  if (!isRecord(row) || typeof row.snapshot_json !== 'string') {
    return null
  }
  try {
    const parsed = JSON.parse(row.snapshot_json) as unknown
    return isRecord(parsed) && typeof parsed.projectId === 'string'
      ? clone(parsed as ProviderExportSnapshot)
      : null
  } catch {
    return null
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
