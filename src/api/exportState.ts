import type { SunoWorkflow } from '../domain/workflow'

export type ProviderExportSnapshot = {
  projectId: string
  projectAssets: SunoWorkflow['projectAssets']
  exports: SunoWorkflow['exports']
  jobQueue: SunoWorkflow['jobQueue']
  provenance: SunoWorkflow['provenance']
}

export function exportSnapshotFromWorkflow(
  projectId: string,
  workflow: SunoWorkflow,
): ProviderExportSnapshot {
  return {
    projectId,
    projectAssets: workflow.projectAssets,
    exports: workflow.exports,
    jobQueue: workflow.jobQueue,
    provenance: workflow.provenance,
  }
}

export function mergeProviderExportSnapshot(
  workflow: SunoWorkflow,
  snapshot: ProviderExportSnapshot | null | undefined,
): SunoWorkflow {
  if (!snapshot) {
    return workflow
  }

  return {
    ...workflow,
    projectAssets: {
      items: upsertById(workflow.projectAssets.items, snapshot.projectAssets.items),
      imports: upsertById(workflow.projectAssets.imports, snapshot.projectAssets.imports),
    },
    exports: {
      tasks: upsertById(workflow.exports.tasks, snapshot.exports.tasks),
      downloads: upsertById(workflow.exports.downloads, snapshot.exports.downloads),
      callbacks: upsertById(workflow.exports.callbacks, snapshot.exports.callbacks),
    },
    jobQueue: upsertById(workflow.jobQueue, snapshot.jobQueue),
    provenance: appendUnique(workflow.provenance, snapshot.provenance),
  }
}

function upsertById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return [...byId.values()]
}

function appendUnique(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing)
  const next = [...existing]
  for (const item of incoming) {
    if (!seen.has(item)) {
      seen.add(item)
      next.push(item)
    }
  }
  return next
}
