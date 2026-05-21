import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exportSnapshotFromWorkflow } from '../src/api/exportState'
import { projectSnapshotFromState } from '../src/api/projectStore'
import { createWorkflow } from '../src/domain/workflow'
import { createSqliteProjectDatabase } from './sqliteProjectStore'

const briefInput = {
  brief: 'SQLite Kantikal hook',
  lyrics: 'Verse chorus',
  style: 'dark club-pop',
  voice: 'consented lead',
}

describe('SQLite project database', () => {
  it('persists project snapshots and provider export snapshots across database instances', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kantikal-db-'))
    const dbPath = join(dir, 'the-kantikal.sqlite')
    const workflow = createWorkflow(briefInput)
    const snapshot = projectSnapshotFromState({
      projectId: 'project-sqlite',
      briefInput,
      workflow,
      releasePack: null,
      savedAt: '2026-05-21T00:00:00.000Z',
    })

    try {
      const first = createSqliteProjectDatabase(dbPath)
      await first.projectStore.saveProject(snapshot)
      await first.providerExportStore.save('project-sqlite', exportSnapshotFromWorkflow('project-sqlite', workflow))
      first.close()

      const second = createSqliteProjectDatabase(dbPath)
      await expect(second.projectStore.loadProject('project-sqlite')).resolves.toMatchObject({
        workflow: { brief: 'SQLite Kantikal hook' },
      })
      await expect(second.providerExportStore.load('project-sqlite')).resolves.toMatchObject({
        projectId: 'project-sqlite',
        provenance: expect.arrayContaining(['brief']),
      })
      second.close()
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined)
    }
  })
})
