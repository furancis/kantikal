import { describe, expect, it } from 'vitest'
import { createProjectStoreRequestHandler } from './projectStoreRoutes'
import { createMemoryProjectStore, projectSnapshotFromState } from '../src/api/projectStore'
import { createWorkflow } from '../src/domain/workflow'

const briefInput = {
  brief: 'Kantikal persistence hook',
  lyrics: 'Verse chorus',
  style: 'dark club-pop',
  voice: 'consented lead',
}

describe('project database routes', () => {
  it('saves, loads, and lists project snapshots through the HTTP database boundary', async () => {
    const route = createProjectStoreRequestHandler(createMemoryProjectStore())
    const snapshot = projectSnapshotFromState({
      projectId: 'project-db',
      briefInput,
      workflow: createWorkflow(briefInput),
      releasePack: null,
      savedAt: '2026-05-21T00:00:00.000Z',
    })

    const saveResponse = await route(
      new Request('http://local.test/api/projects/project-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
        body: JSON.stringify({ snapshot }),
      }),
    )
    const savePayload = await saveResponse.json()
    const loadResponse = await route(new Request('http://local.test/api/projects/project-db'))
    const loadPayload = await loadResponse.json()
    const listResponse = await route(new Request('http://local.test/api/projects'))
    const listPayload = await listResponse.json()

    expect(saveResponse.status).toBe(200)
    expect(savePayload.summary).toMatchObject({ projectId: 'project-db', brief: 'Kantikal persistence hook' })
    expect(loadPayload.snapshot.workflow.brief).toBe('Kantikal persistence hook')
    expect(listPayload.projects).toEqual([expect.objectContaining({ projectId: 'project-db' })])
  })

  it('rejects cross-origin project writes', async () => {
    const route = createProjectStoreRequestHandler(createMemoryProjectStore())

    const response = await route(
      new Request('http://local.test/api/projects/project-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example',
        },
        body: JSON.stringify({ snapshot: {} }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.error).toMatch(/local browser origin/i)
  })
})
