export type WorkflowStage =
  | 'brief-ready'
  | 'batch-ready'
  | 'track-selected'
  | 'video-open'

export type BriefInput = {
  brief: string
  lyrics: string
  style: string
  voice: string
}

export type GeneratedTrack = {
  id: string
  title: string
  durationSeconds: number
}

export type GenerationBatch = {
  providerJobId: string
  tracks: GeneratedTrack[]
}

export type TrackTasteRating = {
  trackId: string
  score: number
  notes: string
  tags: string[]
}

export type VersionComparison = {
  id: string
  leftTrackId: string
  rightTrackId: string
  winnerTrackId: string
  notes: string
}

export type TasteState = {
  ratings: Record<string, TrackTasteRating>
  comparisons: VersionComparison[]
}

export type SongLabSection = {
  id: string
  label: string
  startSeconds: number
  endSeconds: number
  locked: boolean
  sourceTrackId: string
}

export type SongStem = {
  id: 'vocals' | 'instrumental' | 'full-mix'
  label: string
  status: 'available' | 'planned' | 'queued'
  sourceTrackId: string
}

export type SongLabEditAction = {
  id: string
  sectionId: string
  action: string
  label: string
  status: 'queued' | 'planned' | 'blocked' | 'completed'
  providerJobId?: string
}

export type SongLab = {
  sourceTrackId: string
  status: 'open'
  sections: SongLabSection[]
  stems: SongStem[]
  editActions: SongLabEditAction[]
  assetRefs: string[]
}

export type ProviderJobStatus = 'planned' | 'blocked' | 'unsupported' | 'completed'

export type ProviderJobResultInput = {
  action: string
  capability: string
  outcome: 'succeeded' | 'planned' | 'blocked' | 'unsupported'
  message: string
  authBoundary: string
  endpoint?: string
  providerTaskId?: string
  receiptId: string
}

export type ProviderJob = {
  id: string
  action: string
  capability: string
  outcome: ProviderJobResultInput['outcome']
  status: ProviderJobStatus
  message: string
  authBoundary: string
  endpoint?: string
  providerTaskId?: string
  receiptId: string
  sourceTrackId?: string
}

export type LocalLibraryItem = {
  id: string
  scope: 'local-project'
  track: GeneratedTrack
  notes: string
  tags: string[]
  ratingScore?: number
}

export type LocalLibraryState = {
  providerLibraryStatus: 'unsupported'
  items: LocalLibraryItem[]
}

export type ProjectAssetKind =
  | 'reference-audio'
  | 'lyrics-doc'
  | 'cover-art'
  | 'persona-reference'
  | 'video-reference'
  | 'generated-audio'
  | 'stem'
  | 'video-output'

export type ProjectAssetStatus = 'available' | 'planned' | 'blocked' | 'unsupported' | 'failed'

export type ProjectAsset = {
  id: string
  kind: ProjectAssetKind
  label: string
  status: ProjectAssetStatus
  source: 'prompt' | 'provider'
  providerAction?: string
  authBoundary: string
  sourceIds: string[]
  tags: string[]
  consentNote?: string
}

export type ProjectAssetImport = {
  id: string
  assetId: string
  action: string
  capability: string
  status: ProviderJobStatus
  authBoundary: string
  endpoint?: string
  message: string
  receiptId: string
}

export type ProjectAssetLibrary = {
  items: ProjectAsset[]
  imports: ProjectAssetImport[]
}

export type ExportOutputKind = 'audio' | 'cover-art' | 'stem' | 'video'

export type ProviderTaskOutput = {
  kind: ExportOutputKind
  label: string
  url: string
  sourceTrackId?: string
  stemName?: string
}

export type ProviderTaskUpdateInput = {
  providerTaskId: string
  action: string
  capability: string
  providerStatus: string
  message: string
  outputs: ProviderTaskOutput[]
  receiptId: string
}

export type ProviderCallbackInput = ProviderTaskUpdateInput & {
  callbackType: string
  code: number
}

export type ExportTaskStatus = 'queued' | 'ready' | 'blocked' | 'failed'

export type ExportTask = {
  id: string
  providerTaskId: string
  action: string
  capability: string
  providerStatus: string
  status: ExportTaskStatus
  message: string
  outputAssetIds: string[]
  receiptId: string
}

export type ExportDownloadStatus = 'ready' | 'blocked' | 'failed'

export type ExportDownload = {
  id: string
  kind: ExportOutputKind
  status: ExportDownloadStatus
  assetId: string
  label: string
  url: string
  sourceTrackId?: string
  providerTaskId: string
  message: string
  receiptId: string
}

export type ProviderCallbackReceipt = {
  id: string
  providerTaskId: string
  callbackType: string
  code: number
  status: 'received' | 'failed'
  message: string
  receiptId: string
}

export type ExportManagerState = {
  tasks: ExportTask[]
  downloads: ExportDownload[]
  callbacks: ProviderCallbackReceipt[]
}

export type VoicePersona = {
  id: string
  label: string
  consentNote: string
  tags: string[]
  assetId: string
  providerStatus: ProjectAssetStatus
  actionReceipts: string[]
}

export type VoicePersonaState = {
  activePersonaId: string | null
  personas: VoicePersona[]
}

const lipsyncCheckNames = ['phoneme', 'frame', 'mouthShape', 'segmentDrift', 'postStitch'] as const

export type LipsyncCheckName = (typeof lipsyncCheckNames)[number]

export type LipsyncChecks = Record<LipsyncCheckName, boolean>

export type LipsyncEvidenceMetrics = {
  phonemeDriftMs: number
  frameOffsetFrames: number
  mouthShapeScore: number
  segmentDriftMs: number
  postStitchDriftMs: number
}

export type LipsyncEvaluatorEvidence = {
  id: string
  evaluator: 'external-worker' | 'local-worker'
  sourceTrackId: string
  sourceVideoUrl: string
  checkedAt: string
  checks: LipsyncChecks
  metrics: LipsyncEvidenceMetrics
  thresholds: LipsyncEvidenceMetrics
  failureRanges: LipsyncFailureRange[]
}

export type LipsyncRepairAttempt = {
  id: string
  failedChecks: LipsyncCheckName[]
  action: string
  status: 'queued' | 'applied'
}

export type MusicVideoSceneMode = 'performance' | 'narrative' | 'abstract' | 'lyric'

export type MusicVideoScene = {
  id: string
  sectionId: string
  title: string
  startSeconds: number
  endSeconds: number
  mode: MusicVideoSceneMode
  prompt: string
  assetRefs: string[]
  sourceTrackId: string
  status: 'planned' | 'queued' | 'rendered' | 'needs-repair'
}

export type ComfyRenderGraphNode = {
  id: string
  type: 'model' | 'seed' | 'references' | 'scene-prompts' | 'output'
  label: string
  value: string
}

export type ComfyRenderPlan = {
  id: string
  sourceTrackId: string
  model: string
  seed: number
  referenceAssetIds: string[]
  nodes: ComfyRenderGraphNode[]
  status: 'planned' | 'queued' | 'blocked'
}

export type MusicVideoWorkerLane = 'render' | 'stitch' | 'qa'

export type MusicVideoWorkerHealth = {
  id: string
  lane: MusicVideoWorkerLane
  label: string
  status: 'planned' | 'queued' | 'blocked' | 'online'
  detail: string
}

export type MusicVideoWorkerJob = {
  id: string
  lane: MusicVideoWorkerLane
  status: 'queued' | 'blocked' | 'completed'
  sourceId: string
  detail: string
}

export type LipsyncFailureRange = {
  id: string
  checkName: LipsyncCheckName
  startSeconds: number
  endSeconds: number
  severity: 'repair' | 'blocker'
  repairAction: string
}

export type MusicVideoLane = {
  sourceTrackId: string
  exportStatus: 'blocked' | 'ready'
  lipsync: LipsyncChecks | null
  lipsyncEvidence: LipsyncEvaluatorEvidence | null
  repairAttempts: LipsyncRepairAttempt[]
  assetRefs: string[]
  scenes: MusicVideoScene[]
  renderPlan: ComfyRenderPlan | null
  workerHealth: MusicVideoWorkerHealth[]
  workerJobs: MusicVideoWorkerJob[]
  failureRanges: LipsyncFailureRange[]
}

export type ReleasePackItemKind = 'audio' | 'video' | 'metadata' | 'prompts' | 'provenance'

export type ReleasePackItem = {
  id: string
  kind: ReleasePackItemKind
  label: string
  sourceId: string
}

export type ProvenanceReceipt = {
  id: string
  action: string
  detail: string
  sourceIds: string[]
}

export type ArchiveEntry = {
  id: string
  track: GeneratedTrack
  reason: string
  receiptId: string
}

export type CleanupReceipt = {
  id: string
  action: 'archive-before-cleanup' | 'cleanup-applied' | 'cleanup-restored'
  targetTrackIds: string[]
  detail: string
}

export type CleanupPlan = {
  id: string
  status: 'archived' | 'applied' | 'restored'
  targetTrackIds: string[]
  receiptId: string
}

export type TrackGenealogyAncestor = {
  id: string
  label: string
  kind: 'prompt' | 'lyrics' | 'style' | 'voice' | 'asset' | 'job'
  evidence: string[]
}

export type TrackGenealogyDescendant = {
  id: string
  label: string
  kind: 'generated-version' | 'song-lab-edit' | 'stem' | 'music-video-variant' | 'export' | 'archived-branch'
  sourceTrackIds: string[]
  status: 'active' | 'selected' | 'queued' | 'planned' | 'ready' | 'archived'
}

export type TrackMutationDiff = {
  trackId: string
  label: string
  changes: string[]
  inherited: string[]
}

export type InheritedTrait = {
  trait: string
  value: string
  evidence: string[]
}

export type BranchFitScore = {
  trackId: string
  score: number
  why: string[]
}

export type DeadBranch = {
  trackId: string
  reason: string
}

export type BreedingSuggestion = {
  id: string
  sourceTrackIds: string[]
  prompt: string
  reason: string
}

export type TrackGenealogyGraphNode = {
  id: string
  label: string
  role: 'ancestor' | 'source' | 'descendant' | 'dead-branch'
}

export type TrackGenealogyGraphEdge = {
  from: string
  to: string
  relationship: string
}

export type TrackGenealogy = {
  sourceTrackId: string | null
  ancestors: TrackGenealogyAncestor[]
  descendants: TrackGenealogyDescendant[]
  mutations: TrackMutationDiff[]
  inheritedTraits: InheritedTrait[]
  fitLineage: BranchFitScore[]
  deadBranches: DeadBranch[]
  breedingSuggestions: BreedingSuggestion[]
  graph: {
    nodes: TrackGenealogyGraphNode[]
    edges: TrackGenealogyGraphEdge[]
  }
}

export type SunoWorkflow = BriefInput & {
  stage: WorkflowStage
  generationBatch: GenerationBatch | null
  selectedTrack: GeneratedTrack | null
  musicVideoLane: MusicVideoLane | null
  taste: TasteState
  songLab: SongLab | null
  jobQueue: ProviderJob[]
  localLibrary: LocalLibraryState
  projectAssets: ProjectAssetLibrary
  voicePersonas: VoicePersonaState
  exports: ExportManagerState
  archiveEntries: ArchiveEntry[]
  cleanupPlan: CleanupPlan | null
  cleanupReceipts: CleanupReceipt[]
  provenance: string[]
}

export type ReleasePack = {
  trackId: string
  includesVideo: boolean
  items: ReleasePackItem[]
  receipts: ProvenanceReceipt[]
  provenance: string[]
}

export function createWorkflow(input: BriefInput): SunoWorkflow {
  return {
    ...input,
    stage: 'brief-ready',
    generationBatch: null,
    selectedTrack: null,
    musicVideoLane: null,
    taste: emptyTasteState(),
    songLab: null,
    jobQueue: [],
    localLibrary: createLocalLibraryState(),
    projectAssets: createProjectAssetLibrary(input),
    voicePersonas: createVoicePersonaState(input),
    exports: createExportManagerState(),
    archiveEntries: [],
    cleanupPlan: null,
    cleanupReceipts: [],
    provenance: ['brief'],
  }
}

export function submitGenerationBatch(
  workflow: SunoWorkflow,
  generationBatch: GenerationBatch,
): SunoWorkflow {
  if (generationBatch.tracks.length === 0) {
    throw new Error('Generation batch requires at least one track')
  }

  return {
    ...workflow,
    stage: 'batch-ready',
    generationBatch,
    selectedTrack: null,
    musicVideoLane: null,
    taste: emptyTasteState(),
    songLab: null,
    cleanupPlan: null,
    provenance: appendOnce(workflow.provenance, 'generation-batch'),
  }
}

export function selectTrack(workflow: SunoWorkflow, trackId: string): SunoWorkflow {
  const selectedTrack = workflow.generationBatch?.tracks.find((track) => track.id === trackId)
  if (!selectedTrack) {
    throw new Error(`Track ${trackId} is not in the active generation batch`)
  }

  return {
    ...workflow,
    stage: 'track-selected',
    selectedTrack,
    musicVideoLane: null,
    songLab: null,
    cleanupPlan: null,
    provenance: appendOnce(workflow.provenance, 'selected-track'),
  }
}

export function rateTrack(
  workflow: SunoWorkflow,
  trackId: string,
  input: { score: number; notes: string; tags?: string[] },
): SunoWorkflow {
  ensureTrackInActiveBatch(workflow, trackId)
  if (input.score < 1 || input.score > 5) {
    throw new Error('Track rating score must be between 1 and 5')
  }

  return {
    ...workflow,
    taste: {
      ...workflow.taste,
      ratings: {
        ...workflow.taste.ratings,
        [trackId]: {
          trackId,
          score: input.score,
          notes: input.notes,
          tags: input.tags ?? [],
        },
      },
    },
    provenance: appendOnce(workflow.provenance, 'taste-rating'),
  }
}

export function compareTracks(
  workflow: SunoWorkflow,
  input: {
    leftTrackId: string
    rightTrackId: string
    winnerTrackId: string
    notes: string
  },
): SunoWorkflow {
  ensureTrackInActiveBatch(workflow, input.leftTrackId)
  ensureTrackInActiveBatch(workflow, input.rightTrackId)
  if (input.leftTrackId === input.rightTrackId) {
    throw new Error('Version comparison requires two different tracks')
  }
  if (![input.leftTrackId, input.rightTrackId].includes(input.winnerTrackId)) {
    throw new Error('Version comparison winner must be one of the compared tracks')
  }

  const comparison: VersionComparison = {
    id: `comparison-${workflow.taste.comparisons.length + 1}`,
    leftTrackId: input.leftTrackId,
    rightTrackId: input.rightTrackId,
    winnerTrackId: input.winnerTrackId,
    notes: input.notes,
  }

  return {
    ...workflow,
    taste: {
      ...workflow.taste,
      comparisons: [...workflow.taste.comparisons, comparison],
    },
    provenance: appendOnce(workflow.provenance, 'version-comparison'),
  }
}

export function openSongLab(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.selectedTrack) {
    throw new Error('Song Lab requires a selected track')
  }

  const selectedTrack = workflow.selectedTrack

  return {
    ...workflow,
    songLab: {
      sourceTrackId: selectedTrack.id,
      status: 'open',
      sections: createSongLabSections(selectedTrack),
      stems: createSongStems(selectedTrack),
      editActions: [],
      assetRefs: assetIdsForWorkflow(workflow),
    },
    provenance: appendOnce(workflow.provenance, 'song-lab-opened'),
  }
}

export function lockSongLabRegion(workflow: SunoWorkflow, sectionId: string): SunoWorkflow {
  if (!workflow.songLab) {
    throw new Error('Song Lab region lock requires an open Song Lab')
  }
  const section = workflow.songLab.sections.find((candidate) => candidate.id === sectionId)
  if (!section) {
    throw new Error(`Song Lab section ${sectionId} is not available`)
  }

  return {
    ...workflow,
    songLab: {
      ...workflow.songLab,
      sections: workflow.songLab.sections.map((candidate) =>
        candidate.id === sectionId ? { ...candidate, locked: true } : candidate,
      ),
    },
    provenance: appendOnce(workflow.provenance, 'song-lab-region-locked'),
  }
}

export function queueSongLabEdit(
  workflow: SunoWorkflow,
  input: { sectionId: string; action: string; label: string },
): SunoWorkflow {
  if (!workflow.songLab) {
    throw new Error('Song Lab edit requires an open Song Lab')
  }
  const section = workflow.songLab.sections.find((candidate) => candidate.id === input.sectionId)
  if (!section) {
    throw new Error(`Song Lab section ${input.sectionId} is not available`)
  }

  const editAction: SongLabEditAction = {
    id: `songlab-edit-${workflow.songLab.editActions.length + 1}`,
    sectionId: input.sectionId,
    action: input.action,
    label: input.label,
    status: 'queued',
  }

  return {
    ...workflow,
    songLab: {
      ...workflow.songLab,
      stems:
        input.action === 'separateStems'
          ? workflow.songLab.stems.map((stem) =>
              stem.id === 'vocals' || stem.id === 'instrumental' ? { ...stem, status: 'queued' } : stem,
            )
          : workflow.songLab.stems,
      editActions: [...workflow.songLab.editActions, editAction],
    },
    provenance: appendOnce(workflow.provenance, 'song-lab-edit-queued'),
  }
}

export function recordProviderJobResult(
  workflow: SunoWorkflow,
  result: ProviderJobResultInput,
): SunoWorkflow {
  return {
    ...workflow,
    jobQueue: [...workflow.jobQueue, createProviderJob(workflow, result)],
    provenance: appendOnce(workflow.provenance, 'provider-job-result'),
  }
}

export function recordProjectAssetImport(
  workflow: SunoWorkflow,
  input: {
    kind: ProjectAssetKind
    label: string
    sourceIds: string[]
    tags?: string[]
    consentNote?: string
  },
  result: ProviderJobResultInput,
): SunoWorkflow {
  const existingAsset =
    input.kind === 'persona-reference'
      ? workflow.projectAssets.items.find((asset) => asset.kind === 'persona-reference')
      : undefined
  const assetId = existingAsset?.id ?? `asset-${input.kind}-${workflow.projectAssets.items.length + 1}`
  const asset: ProjectAsset = {
    id: assetId,
    kind: input.kind,
    label: input.label,
    status: providerOutcomeToAssetStatus(result.outcome),
    source: 'provider',
    providerAction: result.action,
    authBoundary: result.authBoundary,
    sourceIds: input.sourceIds,
    tags: input.tags ?? [],
    consentNote: input.consentNote,
  }
  const importJob: ProjectAssetImport = {
    id: `asset-import-${workflow.projectAssets.imports.length + 1}`,
    assetId,
    action: result.action,
    capability: result.capability,
    status: providerOutcomeToJobStatus(result.outcome),
    authBoundary: result.authBoundary,
    endpoint: result.endpoint,
    message: result.message,
    receiptId: result.receiptId,
  }

  const assetIndex = workflow.projectAssets.items.findIndex((candidate) => candidate.id === assetId)
  const nextAssets =
    assetIndex === -1
      ? [...workflow.projectAssets.items, asset]
      : workflow.projectAssets.items.map((candidate, index) => (index === assetIndex ? asset : candidate))

  return {
    ...workflow,
    projectAssets: {
      items: nextAssets,
      imports: [...workflow.projectAssets.imports, importJob],
    },
    voicePersonas:
      input.kind === 'persona-reference'
        ? upsertVoicePersona(workflow.voicePersonas, asset, result.receiptId)
        : workflow.voicePersonas,
    jobQueue: [...workflow.jobQueue, createProviderJob(workflow, result)],
    provenance: appendOnce(workflow.provenance, 'project-asset-import'),
  }
}

export function recordProviderTaskUpdate(
  workflow: SunoWorkflow,
  input: ProviderTaskUpdateInput,
): SunoWorkflow {
  const taskStatus = providerStatusToExportTaskStatus(input.providerStatus, input.outputs)
  const outputRecords = input.outputs.map((output, index) =>
    toProviderOutputRecord(workflow, input, output, index),
  )
  const task: ExportTask = {
    id: `export-task-${sanitizeId(input.providerTaskId)}`,
    providerTaskId: input.providerTaskId,
    action: input.action,
    capability: input.capability,
    providerStatus: input.providerStatus,
    status: taskStatus,
    message: input.message,
    outputAssetIds: outputRecords.map((record) => record.asset.id),
    receiptId: input.receiptId,
  }
  const providerJobResult: ProviderJobResultInput = {
    action: input.action,
    capability: input.capability,
    outcome: exportTaskStatusToProviderOutcome(taskStatus),
    message: input.message,
    authBoundary: 'server',
    providerTaskId: input.providerTaskId,
    receiptId: input.receiptId,
  }

  return {
    ...workflow,
    projectAssets: {
      ...workflow.projectAssets,
      items: upsertProjectAssets(workflow.projectAssets.items, outputRecords.map((record) => record.asset)),
    },
    exports: {
      ...workflow.exports,
      tasks: upsertExportTask(workflow.exports.tasks, task),
      downloads: upsertExportDownloads(
        workflow.exports.downloads,
        taskStatus === 'failed' ? [] : outputRecords.map((record) => record.download),
      ),
    },
    jobQueue: upsertProviderJob(workflow.jobQueue, createProviderJob(workflow, providerJobResult)),
    provenance: outputRecords.length > 0 && taskStatus !== 'failed'
      ? appendOnce(appendOnce(workflow.provenance, 'provider-task-update'), 'provider-download-assets')
      : appendOnce(workflow.provenance, 'provider-task-update'),
  }
}

export function recordProviderCallback(
  workflow: SunoWorkflow,
  input: ProviderCallbackInput,
): SunoWorkflow {
  const callbackStatus = input.code === 200 ? 'received' : 'failed'
  const callbackReceipt: ProviderCallbackReceipt = {
    id: `callback-${sanitizeId(input.providerTaskId)}-${sanitizeId(input.callbackType)}`,
    providerTaskId: input.providerTaskId,
    callbackType: input.callbackType,
    code: input.code,
    status: callbackStatus,
    message: input.message,
    receiptId: input.receiptId,
  }
  const withCallback = {
    ...workflow,
    exports: {
      ...workflow.exports,
      callbacks: upsertProviderCallback(workflow.exports.callbacks, callbackReceipt),
    },
    provenance: appendOnce(workflow.provenance, 'provider-callback-received'),
  }

  return recordProviderTaskUpdate(withCallback, {
    providerTaskId: input.providerTaskId,
    action: input.action,
    capability: input.capability,
    providerStatus: input.code === 200 ? input.providerStatus : 'FAILED',
    message: input.message,
    outputs: input.code === 200 ? input.outputs : [],
    receiptId: input.receiptId,
  })
}

export function saveSelectedTrackToLocalLibrary(
  workflow: SunoWorkflow,
  input: { notes: string; tags?: string[] },
): SunoWorkflow {
  if (!workflow.selectedTrack) {
    throw new Error('Local library save requires a selected track')
  }

  const selectedTrack = workflow.selectedTrack
  const libraryItem: LocalLibraryItem = {
    id: `local-library-${selectedTrack.id}`,
    scope: 'local-project',
    track: selectedTrack,
    notes: input.notes,
    tags: input.tags ?? [],
    ratingScore: workflow.taste.ratings[selectedTrack.id]?.score,
  }

  return {
    ...workflow,
    localLibrary: {
      ...workflow.localLibrary,
      items: [
        ...workflow.localLibrary.items.filter((item) => item.track.id !== selectedTrack.id),
        libraryItem,
      ],
    },
    provenance: appendOnce(workflow.provenance, 'local-library-save'),
  }
}

export function openMusicVideoLane(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.selectedTrack) {
    throw new Error('Music video lane requires a selected track')
  }
  const selectedTrack = workflow.selectedTrack
  const sectionSource =
    workflow.songLab?.sourceTrackId === selectedTrack.id
      ? workflow.songLab.sections
      : createSongLabSections(selectedTrack)
  const assetRefs = assetIdsForWorkflow(workflow)

  return {
    ...workflow,
    stage: 'video-open',
    musicVideoLane: {
      sourceTrackId: selectedTrack.id,
      exportStatus: 'blocked',
      lipsync: null,
      lipsyncEvidence: null,
      repairAttempts: [],
      assetRefs,
      scenes: createMusicVideoScenes(selectedTrack, sectionSource, assetRefs),
      renderPlan: null,
      workerHealth: createDefaultMusicVideoWorkerHealth(),
      workerJobs: [],
      failureRanges: [],
    },
  }
}

export function planComfyRenderGraph(
  workflow: SunoWorkflow,
  input: { model: string; seed: number; referenceAssetIds: string[] },
): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('ComfyUI render planning requires an open music video lane')
  }

  const referenceAssetIds = mergeIds([...input.referenceAssetIds, ...workflow.musicVideoLane.assetRefs])
  const renderPlan: ComfyRenderPlan = {
    id: `comfy-${workflow.musicVideoLane.sourceTrackId}`,
    sourceTrackId: workflow.musicVideoLane.sourceTrackId,
    model: input.model,
    seed: input.seed,
    referenceAssetIds,
    nodes: createComfyRenderGraphNodes(
      input.model,
      input.seed,
      referenceAssetIds,
      workflow.musicVideoLane.scenes,
    ),
    status: 'planned',
  }

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      renderPlan,
    },
    provenance: appendOnce(workflow.provenance, 'comfy-render-plan'),
  }
}

export function queueMusicVideoRender(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('Music video render queue requires an open music video lane')
  }
  if (!workflow.musicVideoLane.renderPlan) {
    throw new Error('Music video render queue requires a ComfyUI render plan')
  }

  const renderPlan = {
    ...workflow.musicVideoLane.renderPlan,
    status: 'queued' as const,
  }

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      renderPlan,
      scenes: workflow.musicVideoLane.scenes.map((scene) => ({
        ...scene,
        status: 'queued',
      })),
      workerHealth: createQueuedMusicVideoWorkerHealth(),
      workerJobs: createMusicVideoWorkerJobs(renderPlan),
    },
    provenance: appendOnce(workflow.provenance, 'music-video-render-queued'),
  }
}

export function evaluateLipsync(
  workflow: SunoWorkflow,
  lipsync: LipsyncChecks,
  failureRanges: LipsyncFailureRange[] = [],
  evidence: LipsyncEvaluatorEvidence | null = null,
): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('Lipsync QA requires an open music video lane')
  }

  const evidenceApproved = isLipsyncEvidenceApproved(workflow.musicVideoLane, evidence)
  const exportStatus = failedLipsyncChecks(lipsync).length === 0 && evidenceApproved ? 'ready' : 'blocked'
  const activeFailureRanges =
    exportStatus === 'ready'
      ? []
      : evidence?.failureRanges.length
        ? evidence.failureRanges
        : failureRanges.length > 0
        ? failureRanges
        : deriveLipsyncFailureRanges(workflow.musicVideoLane.scenes, lipsync)

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      exportStatus,
      lipsync,
      lipsyncEvidence: evidence,
      failureRanges: activeFailureRanges,
      scenes:
        exportStatus === 'ready'
          ? workflow.musicVideoLane.scenes.map((scene) => ({
              ...scene,
              status: scene.status === 'needs-repair' ? 'rendered' : scene.status,
            }))
          : markScenesForFailureRanges(workflow.musicVideoLane.scenes, activeFailureRanges),
      repairAttempts:
        exportStatus === 'ready'
          ? workflow.musicVideoLane.repairAttempts.map((attempt) => ({
              ...attempt,
              status: 'applied',
            }))
          : workflow.musicVideoLane.repairAttempts,
    },
    provenance: exportStatus === 'ready' ? appendOnce(workflow.provenance, 'lipsync-qa') : workflow.provenance,
  }
}

export function mergeMusicVideoRuntimeWorkflow(
  current: SunoWorkflow,
  runtimeWorkflow: SunoWorkflow,
): SunoWorkflow {
  if (!current.musicVideoLane || !runtimeWorkflow.musicVideoLane) {
    return current
  }
  if (current.musicVideoLane.sourceTrackId !== runtimeWorkflow.musicVideoLane.sourceTrackId) {
    return current
  }

  return {
    ...current,
    musicVideoLane: runtimeWorkflow.musicVideoLane,
    provenance: mergeIds([...current.provenance, ...runtimeWorkflow.provenance]),
  }
}

export function failedLipsyncChecks(lipsync: LipsyncChecks): LipsyncCheckName[] {
  return lipsyncCheckNames.filter((checkName) => !lipsync[checkName])
}

export function isPerfectLipsyncApproved(lane: MusicVideoLane | null | undefined): boolean {
  if (!lane?.lipsync || lane.exportStatus !== 'ready') {
    return false
  }
  return failedLipsyncChecks(lane.lipsync).length === 0 && isLipsyncEvidenceApproved(lane, lane.lipsyncEvidence)
}

function isLipsyncEvidenceApproved(
  lane: MusicVideoLane,
  evidence: LipsyncEvaluatorEvidence | null | undefined,
): boolean {
  if (!evidence || evidence.sourceTrackId !== lane.sourceTrackId || evidence.failureRanges.length > 0) {
    return false
  }
  if (failedLipsyncChecks(evidence.checks).length > 0) {
    return false
  }
  return (
    evidence.metrics.phonemeDriftMs <= evidence.thresholds.phonemeDriftMs &&
    evidence.metrics.frameOffsetFrames <= evidence.thresholds.frameOffsetFrames &&
    evidence.metrics.mouthShapeScore >= evidence.thresholds.mouthShapeScore &&
    evidence.metrics.segmentDriftMs <= evidence.thresholds.segmentDriftMs &&
    evidence.metrics.postStitchDriftMs <= evidence.thresholds.postStitchDriftMs
  )
}

export function queueLipsyncRepair(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('Lipsync repair requires an open music video lane')
  }
  if (!workflow.musicVideoLane.lipsync) {
    throw new Error('Repair pass requires failed lipsync QA checks')
  }

  const failedChecks = failedLipsyncChecks(workflow.musicVideoLane.lipsync)
  if (failedChecks.length === 0) {
    throw new Error('Repair pass requires failed lipsync checks')
  }

  const repairAttempt: LipsyncRepairAttempt = {
    id: `repair-${workflow.musicVideoLane.repairAttempts.length + 1}`,
    failedChecks,
    action: `Repair ${failedChecks.join(', ')}`,
    status: 'queued',
  }

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      exportStatus: 'blocked',
      repairAttempts: [...workflow.musicVideoLane.repairAttempts, repairAttempt],
    },
    provenance: appendOnce(workflow.provenance, 'lipsync-repair'),
  }
}

export function toReleasePack(
  workflow: SunoWorkflow,
  options: { includeVideo: boolean },
): ReleasePack {
  if (!workflow.selectedTrack) {
    throw new Error('Release pack requires a selected track')
  }

  if (options.includeVideo) {
    if (!workflow.musicVideoLane) {
      throw new Error('Video release requires the music video lane')
    }
    if (!isPerfectLipsyncApproved(workflow.musicVideoLane)) {
      throw new Error('Video release is blocked until lipsync QA passes')
    }
  }

  return {
    trackId: workflow.selectedTrack.id,
    includesVideo: options.includeVideo,
    items: toReleasePackItems(workflow, options.includeVideo),
    receipts: toReleasePackReceipts(workflow, options.includeVideo),
    provenance: appendOnce(workflow.provenance, 'release-pack'),
  }
}

export function planArchiveFirstCleanup(
  workflow: SunoWorkflow,
  targetTrackIds: string[],
  reason: string,
): SunoWorkflow {
  if (!workflow.generationBatch) {
    throw new Error('Cleanup requires a generation batch')
  }
  if (!workflow.selectedTrack) {
    throw new Error('Cleanup requires a selected source track')
  }
  if (targetTrackIds.length === 0) {
    throw new Error('Cleanup requires at least one target track')
  }
  if (targetTrackIds.includes(workflow.selectedTrack.id)) {
    throw new Error('Cleanup cannot target the selected source track')
  }

  const targetTracks = targetTrackIds.map((trackId) => {
    const track = workflow.generationBatch?.tracks.find((candidate) => candidate.id === trackId)
    if (!track) {
      throw new Error(`Cleanup target ${trackId} is not in the active generation batch`)
    }
    return track
  })

  const receiptId = `cleanup-receipt-${workflow.cleanupReceipts.length + 1}`
  const existingArchiveCount = workflow.archiveEntries.length
  const archiveEntries = targetTracks.map((track, index) => ({
    id: `archive-${existingArchiveCount + index + 1}`,
    track,
    reason,
    receiptId,
  }))
  const cleanupPlan: CleanupPlan = {
    id: `cleanup-${workflow.cleanupReceipts.length + 1}`,
    status: 'archived',
    targetTrackIds,
    receiptId,
  }
  const cleanupReceipt: CleanupReceipt = {
    id: receiptId,
    action: 'archive-before-cleanup',
    targetTrackIds,
    detail: `Archived ${targetTrackIds.length} generated track(s) before cleanup: ${reason}`,
  }

  return {
    ...workflow,
    archiveEntries: [...workflow.archiveEntries, ...archiveEntries],
    cleanupPlan,
    cleanupReceipts: [...workflow.cleanupReceipts, cleanupReceipt],
    provenance: appendOnce(workflow.provenance, 'archive-first-cleanup'),
  }
}

export function applyArchiveFirstCleanup(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.generationBatch) {
    throw new Error('Cleanup apply requires a generation batch')
  }
  if (!workflow.cleanupPlan || workflow.cleanupPlan.status !== 'archived') {
    throw new Error('Cleanup apply requires an archived cleanup plan')
  }

  const targetTrackIds = workflow.cleanupPlan.targetTrackIds
  const archivedTrackIds = new Set(
    workflow.archiveEntries
      .filter((entry) => entry.receiptId === workflow.cleanupPlan?.receiptId)
      .map((entry) => entry.track.id),
  )
  const missingArchiveEntries = targetTrackIds.filter((trackId) => !archivedTrackIds.has(trackId))
  if (missingArchiveEntries.length > 0) {
    throw new Error(`Cleanup apply requires archive entries for ${missingArchiveEntries.join(', ')}`)
  }

  const cleanupReceipt: CleanupReceipt = {
    id: `cleanup-receipt-${workflow.cleanupReceipts.length + 1}`,
    action: 'cleanup-applied',
    targetTrackIds,
    detail: `Removed ${targetTrackIds.length} archived generated track(s) from active workspace`,
  }

  return {
    ...workflow,
    generationBatch: {
      ...workflow.generationBatch,
      tracks: workflow.generationBatch.tracks.filter((track) => !targetTrackIds.includes(track.id)),
    },
    cleanupPlan: {
      ...workflow.cleanupPlan,
      status: 'applied',
    },
    cleanupReceipts: [...workflow.cleanupReceipts, cleanupReceipt],
  }
}

export function restoreArchivedTracks(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.generationBatch) {
    throw new Error('Archive restore requires a generation batch')
  }
  if (!workflow.cleanupPlan || workflow.cleanupPlan.status !== 'applied') {
    throw new Error('Archive restore requires an applied cleanup plan')
  }

  const targetTrackIds = workflow.cleanupPlan.targetTrackIds
  const archivedTracks = workflow.archiveEntries
    .filter((entry) => targetTrackIds.includes(entry.track.id))
    .map((entry) => entry.track)
  const activeTrackIds = new Set(workflow.generationBatch.tracks.map((track) => track.id))
  const tracksToRestore = archivedTracks.filter((track) => !activeTrackIds.has(track.id))
  const cleanupReceipt: CleanupReceipt = {
    id: `cleanup-receipt-${workflow.cleanupReceipts.length + 1}`,
    action: 'cleanup-restored',
    targetTrackIds,
    detail: `Restored ${tracksToRestore.length} archived generated track(s) to active workspace`,
  }

  return {
    ...workflow,
    generationBatch: {
      ...workflow.generationBatch,
      tracks: [...workflow.generationBatch.tracks, ...tracksToRestore],
    },
    cleanupPlan: {
      ...workflow.cleanupPlan,
      status: 'restored',
    },
    cleanupReceipts: [...workflow.cleanupReceipts, cleanupReceipt],
  }
}

export function analyzeTrackGenealogy(workflow: SunoWorkflow): TrackGenealogy {
  const selectedTrack = workflow.selectedTrack
  const tracks = workflow.generationBatch?.tracks ?? []
  const sourceTrackId = selectedTrack?.id ?? null
  const ancestors = trackGenealogyAncestors(workflow)
  const descendants = trackGenealogyDescendants(workflow)
  const inheritedTraits = trackGenealogyInheritedTraits(workflow)
  const inheritedTraitNames = inheritedTraits.map((trait) => trait.trait)
  const mutations = tracks.map((track) => trackMutationDiff(workflow, track, selectedTrack, inheritedTraitNames))
  const fitLineage = tracks.map((track) => branchFitScore(workflow, track)).sort((left, right) => right.score - left.score)
  const deadBranches = fitLineage
    .map((fit) => deadBranchForTrack(workflow, fit.trackId))
    .filter((branch): branch is DeadBranch => Boolean(branch))
  const breedingSuggestions = trackGenealogyBreedingSuggestions(workflow, fitLineage)

  return {
    sourceTrackId,
    ancestors,
    descendants,
    mutations,
    inheritedTraits,
    fitLineage,
    deadBranches,
    breedingSuggestions,
    graph: trackGenealogyGraph(sourceTrackId, ancestors, descendants, deadBranches),
  }
}

export function createLineageGenerationBrief(
  workflow: SunoWorkflow,
  suggestion = analyzeTrackGenealogy(workflow).breedingSuggestions[0],
): BriefInput {
  if (!suggestion) {
    return workflow
  }

  return {
    brief: `${workflow.brief}\nLineage: ${suggestion.prompt}`,
    lyrics: workflow.lyrics,
    style: `${workflow.style}; lineage-guided from ${suggestion.sourceTrackIds.join(' + ')}`,
    voice: workflow.voice,
  }
}

function toReleasePackItems(workflow: SunoWorkflow, includeVideo: boolean): ReleasePackItem[] {
  const selectedTrack = workflow.selectedTrack
  if (!selectedTrack) {
    return []
  }

  const items: ReleasePackItem[] = [
    {
      id: `audio-${selectedTrack.id}`,
      kind: 'audio',
      label: `${selectedTrack.title} master audio`,
      sourceId: selectedTrack.id,
    },
    {
      id: `metadata-${selectedTrack.id}`,
      kind: 'metadata',
      label: `${selectedTrack.title} release metadata`,
      sourceId: selectedTrack.id,
    },
    {
      id: `prompts-${selectedTrack.id}`,
      kind: 'prompts',
      label: `${selectedTrack.title} prompt and lyric inputs`,
      sourceId: selectedTrack.id,
    },
    {
      id: `provenance-${selectedTrack.id}`,
      kind: 'provenance',
      label: `${selectedTrack.title} provenance receipts`,
      sourceId: selectedTrack.id,
    },
  ]

  if (includeVideo) {
    items.splice(1, 0, {
      id: `video-${selectedTrack.id}`,
      kind: 'video',
      label: `${selectedTrack.title} lipsync-approved video`,
      sourceId: selectedTrack.id,
    })
  }

  return items
}

function toReleasePackReceipts(workflow: SunoWorkflow, includeVideo: boolean): ProvenanceReceipt[] {
  const selectedTrack = workflow.selectedTrack
  if (!selectedTrack) {
    return []
  }

  const receipts: ProvenanceReceipt[] = [
    {
      id: `receipt-source-${selectedTrack.id}`,
      action: 'source-track-locked',
      detail: `${selectedTrack.title} is the release source of truth`,
      sourceIds: [selectedTrack.id],
    },
    {
      id: `receipt-prompts-${selectedTrack.id}`,
      action: 'prompt-inputs-captured',
      detail: 'Brief, lyrics, style, and voice inputs captured for release',
      sourceIds: ['brief', 'lyrics', 'style', 'voice'],
    },
  ]

  if (includeVideo) {
    const evidenceId = workflow.musicVideoLane?.lipsyncEvidence?.id
    receipts.push({
      id: `receipt-video-${selectedTrack.id}`,
      action: 'lipsync-qa-passed',
      detail: evidenceId
        ? `Music-video export passed evaluator-backed hard lipsync checks in ${evidenceId}`
        : 'Music-video export passed all hard lipsync checks',
      sourceIds: evidenceId ? [selectedTrack.id, evidenceId] : [selectedTrack.id],
    })
  }

  receipts.push({
    id: `receipt-pack-${selectedTrack.id}`,
    action: 'release-pack-created',
    detail: `${includeVideo ? 'Audio/video' : 'Audio'} release pack generated`,
    sourceIds: [selectedTrack.id],
  })

  return receipts
}

function emptyTasteState(): TasteState {
  return {
    ratings: {},
    comparisons: [],
  }
}

function createLocalLibraryState(): LocalLibraryState {
  return {
    providerLibraryStatus: 'unsupported',
    items: [],
  }
}

function createExportManagerState(): ExportManagerState {
  return {
    tasks: [],
    downloads: [],
    callbacks: [],
  }
}

function trackGenealogyAncestors(workflow: SunoWorkflow): TrackGenealogyAncestor[] {
  return [
    {
      id: 'brief',
      label: 'Brief DNA',
      kind: 'prompt',
      evidence: [workflow.brief],
    },
    {
      id: 'lyrics',
      label: 'Lyric DNA',
      kind: 'lyrics',
      evidence: [workflow.lyrics],
    },
    {
      id: 'style',
      label: 'Style DNA',
      kind: 'style',
      evidence: [workflow.style],
    },
    {
      id: 'voice',
      label: 'Voice DNA',
      kind: 'voice',
      evidence: [workflow.voice],
    },
    ...(workflow.generationBatch
      ? [
          {
            id: workflow.generationBatch.providerJobId,
            label: 'Generation job',
            kind: 'job' as const,
            evidence: [`${workflow.generationBatch.tracks.length} generated version(s)`],
          },
        ]
      : []),
    ...workflow.projectAssets.items.map((asset) => ({
      id: asset.id,
      label: asset.label,
      kind: 'asset' as const,
      evidence: [asset.kind, asset.status, ...asset.tags],
    })),
  ]
}

function trackGenealogyDescendants(workflow: SunoWorkflow): TrackGenealogyDescendant[] {
  const generated = (workflow.generationBatch?.tracks ?? []).map((track) => ({
    id: track.id,
    label: track.title,
    kind: 'generated-version' as const,
    sourceTrackIds: ['brief', workflow.generationBatch?.providerJobId ?? 'generation-job'],
    status: track.id === workflow.selectedTrack?.id ? 'selected' as const : 'active' as const,
  }))
  const songLabEdits = (workflow.songLab?.editActions ?? []).map((action) => ({
    id: action.id,
    label: action.label,
    kind: 'song-lab-edit' as const,
    sourceTrackIds: [workflow.songLab?.sourceTrackId ?? 'selected-track', action.sectionId],
    status: action.status === 'queued' ? 'queued' as const : 'planned' as const,
  }))
  const stems = (workflow.songLab?.stems ?? []).map((stem) => ({
    id: `stem-${stem.id}`,
    label: stem.label,
    kind: 'stem' as const,
    sourceTrackIds: [stem.sourceTrackId],
    status: stem.status === 'available' ? 'ready' as const : stem.status === 'queued' ? 'queued' as const : 'planned' as const,
  }))
  const videoVariants = (workflow.musicVideoLane?.scenes ?? []).map((scene) => ({
    id: scene.id,
    label: scene.title,
    kind: 'music-video-variant' as const,
    sourceTrackIds: [scene.sourceTrackId, scene.sectionId],
    status: scene.status === 'rendered' ? 'ready' as const : scene.status === 'queued' ? 'queued' as const : 'planned' as const,
  }))
  const exports = workflow.exports.downloads.map((download) => ({
    id: download.id,
    label: download.label,
    kind: 'export' as const,
    sourceTrackIds: download.sourceTrackId ? [download.sourceTrackId] : [],
    status: download.status === 'ready' ? 'ready' as const : 'planned' as const,
  }))
  const archived = workflow.archiveEntries.map((entry) => ({
    id: `archived-${entry.track.id}`,
    label: entry.track.title,
    kind: 'archived-branch' as const,
    sourceTrackIds: [entry.track.id, entry.receiptId],
    status: 'archived' as const,
  }))

  return [...generated, ...songLabEdits, ...stems, ...videoVariants, ...exports, ...archived]
}

function trackGenealogyInheritedTraits(workflow: SunoWorkflow): InheritedTrait[] {
  return [
    {
      trait: 'chorus shape',
      value: workflow.lyrics.match(/chorus|hook/i) ? 'hook/chorus-led structure' : 'lyric structure from prompt',
      evidence: ['lyrics'],
    },
    {
      trait: 'rhythm palette',
      value: workflow.style,
      evidence: ['style'],
    },
    {
      trait: 'vocal identity',
      value: workflow.voice,
      evidence: ['voice'],
    },
    {
      trait: 'mood',
      value: workflow.brief,
      evidence: ['brief'],
    },
    {
      trait: 'language mix',
      value: workflow.brief.match(/arabic|bilingual|gulf|khaliji/i)
        ? 'Arabic/bilingual project identity'
        : 'language direction from brief',
      evidence: ['brief', 'lyrics'],
    },
  ]
}

function trackMutationDiff(
  workflow: SunoWorkflow,
  track: GeneratedTrack,
  selectedTrack: GeneratedTrack | null,
  inherited: string[],
): TrackMutationDiff {
  const changes: string[] = []
  const rating = workflow.taste.ratings[track.id]
  const comparison = workflow.taste.comparisons.find(
    (candidate) => candidate.leftTrackId === track.id || candidate.rightTrackId === track.id,
  )
  const archived = workflow.archiveEntries.find((entry) => entry.track.id === track.id)

  if (selectedTrack && track.id !== selectedTrack.id) {
    const durationDelta = track.durationSeconds - selectedTrack.durationSeconds
    if (durationDelta !== 0) {
      changes.push(`duration ${durationDelta > 0 ? '+' : ''}${durationDelta}s vs selected source`)
    }
  }
  if (track.id === selectedTrack?.id) {
    changes.push('selected source of truth')
  }
  if (rating) {
    changes.push(`taste ${rating.score}/5: ${rating.notes}`)
  }
  if (comparison) {
    changes.push(
      comparison.winnerTrackId === track.id
        ? `won comparison: ${comparison.notes}`
        : `lost comparison: ${comparison.notes}`,
    )
  }
  if (archived) {
    changes.push(`archived: ${archived.reason}`)
  }
  if (changes.length === 0) {
    changes.push('metadata-only variant; no tracked mutation note yet')
  }

  return {
    trackId: track.id,
    label: track.title,
    changes,
    inherited: inherited.slice(0, 4),
  }
}

function branchFitScore(workflow: SunoWorkflow, track: GeneratedTrack): BranchFitScore {
  const rating = workflow.taste.ratings[track.id]
  const wonComparisons = workflow.taste.comparisons.filter((comparison) => comparison.winnerTrackId === track.id)
  const isSelected = workflow.selectedTrack?.id === track.id
  const archived = workflow.archiveEntries.find((entry) => entry.track.id === track.id)
  const score = rating?.score ?? (isSelected ? 4 : archived ? 1 : 3)
  const why = [
    ...(isSelected ? ['selected source track'] : []),
    ...(rating ? [rating.notes] : ['no taste rating yet']),
    ...wonComparisons.map((comparison) => comparison.notes),
    ...(archived ? [`archived: ${archived.reason}`] : []),
  ]

  return {
    trackId: track.id,
    score,
    why,
  }
}

function deadBranchForTrack(workflow: SunoWorkflow, trackId: string): DeadBranch | null {
  const archiveEntry = workflow.archiveEntries.find((entry) => entry.track.id === trackId)
  if (archiveEntry) {
    return {
      trackId,
      reason: archiveEntry.reason,
    }
  }
  const rating = workflow.taste.ratings[trackId]
  if (rating && rating.score <= 2) {
    return {
      trackId,
      reason: rating.notes,
    }
  }
  return null
}

function trackGenealogyBreedingSuggestions(
  workflow: SunoWorkflow,
  fitLineage: BranchFitScore[],
): BreedingSuggestion[] {
  const primary = fitLineage[0]
  const secondary = fitLineage.find((candidate) => candidate.trackId !== primary?.trackId)
  if (!primary || !secondary) {
    return []
  }

  const primaryRating = workflow.taste.ratings[primary.trackId]
  const secondaryRating = workflow.taste.ratings[secondary.trackId]
  const primaryTrait = primaryRating?.tags.includes('hook') ? 'hook' : 'chorus shape'
  const secondaryTrait = secondaryRating?.tags.includes('mix') ? 'vocal/mix direction' : 'arrangement direction'

  return [
    {
      id: `breed-${primary.trackId}-${secondary.trackId}`,
      sourceTrackIds: [primary.trackId, secondary.trackId],
      prompt: `combine ${primary.trackId} with ${secondary.trackId}: keep ${primaryTrait}; borrow ${secondaryTrait}`,
      reason: `${primary.trackId} is the best-fit branch; ${secondary.trackId} contributes reusable mutation traits.`,
    },
  ]
}

function trackGenealogyGraph(
  sourceTrackId: string | null,
  ancestors: TrackGenealogyAncestor[],
  descendants: TrackGenealogyDescendant[],
  deadBranches: DeadBranch[],
): TrackGenealogy['graph'] {
  const deadTrackIds = new Set(deadBranches.map((branch) => branch.trackId))
  const nodes: TrackGenealogyGraphNode[] = [
    ...ancestors.map((ancestor) => ({
      id: ancestor.id,
      label: ancestor.label,
      role: 'ancestor' as const,
    })),
    ...descendants.map((descendant) => ({
      id: descendant.id,
      label: descendant.label,
      role:
        deadTrackIds.has(descendant.id) || descendant.sourceTrackIds.some((trackId) => deadTrackIds.has(trackId))
          ? 'dead-branch' as const
          : descendant.id === sourceTrackId ? 'source' as const
            : 'descendant' as const,
    })),
  ]
  const edges: TrackGenealogyGraphEdge[] = [
    ...ancestors.map((ancestor) => ({
      from: ancestor.id,
      to: sourceTrackId ?? descendants[0]?.id ?? ancestor.id,
      relationship: 'informs',
    })),
    ...descendants
      .filter((descendant) => descendant.id !== sourceTrackId)
      .map((descendant) => ({
        from: sourceTrackId ?? 'brief',
        to: descendant.id,
        relationship: descendant.kind,
      })),
  ]

  return { nodes, edges }
}

function createProjectAssetLibrary(input: BriefInput): ProjectAssetLibrary {
  return {
    items: [
      {
        id: 'asset-lyrics-draft',
        kind: 'lyrics-doc',
        label: 'Prompt lyrics document',
        status: 'available',
        source: 'prompt',
        authBoundary: 'none',
        sourceIds: ['lyrics'],
        tags: ['lyrics', 'prompt-history'],
      },
      {
        id: 'asset-persona-seed',
        kind: 'persona-reference',
        label: 'Prompt voice persona',
        status: 'available',
        source: 'prompt',
        authBoundary: 'none',
        sourceIds: ['voice'],
        tags: ['consent', 'prompt-safe'],
        consentNote: input.voice,
      },
    ],
    imports: [],
  }
}

function createVoicePersonaState(input: BriefInput): VoicePersonaState {
  return {
    activePersonaId: 'persona-prompt',
    personas: [
      {
        id: 'persona-prompt',
        label: 'Prompt voice persona',
        consentNote: input.voice,
        tags: ['consent', 'prompt-safe'],
        assetId: 'asset-persona-seed',
        providerStatus: 'available',
        actionReceipts: [],
      },
    ],
  }
}

function ensureTrackInActiveBatch(workflow: SunoWorkflow, trackId: string): GeneratedTrack {
  const track = workflow.generationBatch?.tracks.find((candidate) => candidate.id === trackId)
  if (!track) {
    throw new Error(`Track ${trackId} is not in the active generation batch`)
  }
  return track
}

function createSongLabSections(track: GeneratedTrack): SongLabSection[] {
  const introEnd = Math.max(8, Math.round(track.durationSeconds * 0.12))
  const verseEnd = Math.max(introEnd + 8, Math.round(track.durationSeconds * 0.42))
  const hookEnd = Math.max(verseEnd + 8, Math.round(track.durationSeconds * 0.7))
  const sectionBounds = [
    ['intro', 'Intro', 0, introEnd],
    ['verse', 'Verse', introEnd, verseEnd],
    ['hook', 'Hook', verseEnd, hookEnd],
    ['outro', 'Outro', hookEnd, track.durationSeconds],
  ] as const

  return sectionBounds.map(([id, label, startSeconds, endSeconds]) => ({
    id,
    label,
    startSeconds,
    endSeconds,
    locked: false,
    sourceTrackId: track.id,
  }))
}

function createSongStems(track: GeneratedTrack): SongStem[] {
  return [
    {
      id: 'vocals',
      label: 'Vocal stem',
      status: 'planned',
      sourceTrackId: track.id,
    },
    {
      id: 'instrumental',
      label: 'Instrumental stem',
      status: 'planned',
      sourceTrackId: track.id,
    },
    {
      id: 'full-mix',
      label: 'Full mix source',
      status: 'available',
      sourceTrackId: track.id,
    },
  ]
}

function createMusicVideoScenes(
  track: GeneratedTrack,
  sections: SongLabSection[],
  assetRefs: string[],
): MusicVideoScene[] {
  const modeBySection: Record<string, MusicVideoSceneMode> = {
    intro: 'narrative',
    verse: 'performance',
    hook: 'lyric',
    outro: 'abstract',
  }

  return sections.map((section) => ({
    id: `scene-${section.id}`,
    sectionId: section.id,
    title: `${section.label} scene`,
    startSeconds: section.startSeconds,
    endSeconds: section.endSeconds,
    mode: modeBySection[section.id] ?? 'performance',
    prompt: `${track.title} ${section.label.toLowerCase()} visual treatment`,
    assetRefs: [`audio:${track.id}`, `section:${section.id}`, ...assetRefs],
    sourceTrackId: track.id,
    status: 'planned',
  }))
}

function createComfyRenderGraphNodes(
  model: string,
  seed: number,
  referenceAssetIds: string[],
  scenes: MusicVideoScene[],
): ComfyRenderGraphNode[] {
  return [
    {
      id: 'model',
      type: 'model',
      label: 'ComfyUI model',
      value: model,
    },
    {
      id: 'seed',
      type: 'seed',
      label: 'Render seed',
      value: String(seed),
    },
    {
      id: 'references',
      type: 'references',
      label: 'Reference assets',
      value: referenceAssetIds.length > 0 ? referenceAssetIds.join(', ') : 'none',
    },
    {
      id: 'scene-prompts',
      type: 'scene-prompts',
      label: 'Scene prompts',
      value: `${scenes.length} timestamped scene prompts`,
    },
    {
      id: 'output',
      type: 'output',
      label: 'Output route',
      value: 'blocked until external worker is connected',
    },
  ]
}

function createDefaultMusicVideoWorkerHealth(): MusicVideoWorkerHealth[] {
  return [
    {
      id: 'render-worker',
      lane: 'render',
      label: 'ComfyUI render worker',
      status: 'planned',
      detail: 'Waiting for a render graph',
    },
    {
      id: 'stitch-worker',
      lane: 'stitch',
      label: 'Stitch worker',
      status: 'planned',
      detail: 'Waiting for rendered scenes',
    },
    {
      id: 'qa-worker',
      lane: 'qa',
      label: 'Lipsync QA worker',
      status: 'planned',
      detail: 'Waiting for stitched video',
    },
  ]
}

function createQueuedMusicVideoWorkerHealth(): MusicVideoWorkerHealth[] {
  return [
    {
      id: 'render-worker',
      lane: 'render',
      label: 'ComfyUI render worker',
      status: 'blocked',
      detail: 'External ComfyUI worker is modeled but not connected in the browser lane',
    },
    {
      id: 'stitch-worker',
      lane: 'stitch',
      label: 'Stitch worker',
      status: 'queued',
      detail: 'Waiting for rendered scenes',
    },
    {
      id: 'qa-worker',
      lane: 'qa',
      label: 'Lipsync QA worker',
      status: 'queued',
      detail: 'Waiting for stitched video and phoneme timing',
    },
  ]
}

function createMusicVideoWorkerJobs(renderPlan: ComfyRenderPlan): MusicVideoWorkerJob[] {
  return [
    {
      id: 'mv-job-render-1',
      lane: 'render',
      status: 'blocked',
      sourceId: renderPlan.id,
      detail: 'ComfyUI external-worker execution is not connected yet',
    },
    {
      id: 'mv-job-stitch-1',
      lane: 'stitch',
      status: 'queued',
      sourceId: renderPlan.id,
      detail: 'Stitch waits for rendered scene outputs',
    },
    {
      id: 'mv-job-qa-1',
      lane: 'qa',
      status: 'queued',
      sourceId: renderPlan.id,
      detail: 'QA waits for stitched video and exact lipsync ranges',
    },
  ]
}

function deriveLipsyncFailureRanges(
  scenes: MusicVideoScene[],
  lipsync: LipsyncChecks,
): LipsyncFailureRange[] {
  const failedChecks = failedLipsyncChecks(lipsync)
  if (failedChecks.length === 0) {
    return []
  }
  const fallbackScene = scenes.find((scene) => scene.sectionId === 'hook') ?? scenes[0]
  if (!fallbackScene) {
    return []
  }

  return failedChecks.map((checkName, index) => ({
    id: `range-${checkName}-${index + 1}`,
    checkName,
    startSeconds: fallbackScene.startSeconds,
    endSeconds: fallbackScene.endSeconds,
    severity: 'blocker',
    repairAction: `Repair ${checkName} timing before export`,
  }))
}

function markScenesForFailureRanges(
  scenes: MusicVideoScene[],
  failureRanges: LipsyncFailureRange[],
): MusicVideoScene[] {
  return scenes.map((scene) => {
    const hasFailure = failureRanges.some(
      (range) => range.startSeconds < scene.endSeconds && range.endSeconds > scene.startSeconds,
    )
    return hasFailure ? { ...scene, status: 'needs-repair' } : scene
  })
}

function providerOutcomeToJobStatus(outcome: ProviderJobResultInput['outcome']): ProviderJobStatus {
  if (outcome === 'succeeded') {
    return 'completed'
  }
  return outcome
}

function providerOutcomeToAssetStatus(outcome: ProviderJobResultInput['outcome']): ProjectAssetStatus {
  if (outcome === 'succeeded') {
    return 'available'
  }
  return outcome
}

function providerStatusToExportTaskStatus(
  providerStatus: string,
  outputs: ProviderTaskOutput[],
): ExportTaskStatus {
  const normalized = providerStatus.toUpperCase()
  if (
    [
      'CREATE_TASK_FAILED',
      'GENERATE_AUDIO_FAILED',
      'CALLBACK_EXCEPTION',
      'SENSITIVE_WORD_ERROR',
      'FAILED',
      'FAILURE',
      'ERROR',
    ].includes(normalized)
  ) {
    return 'failed'
  }
  if (normalized === 'SUCCESS' && outputs.length > 0) {
    return 'ready'
  }
  if (normalized === 'SUCCESS') {
    return 'blocked'
  }
  return 'queued'
}

function exportTaskStatusToProviderOutcome(status: ExportTaskStatus): ProviderJobResultInput['outcome'] {
  if (status === 'ready') {
    return 'succeeded'
  }
  if (status === 'queued') {
    return 'planned'
  }
  return 'blocked'
}

function toProviderOutputRecord(
  workflow: SunoWorkflow,
  input: ProviderTaskUpdateInput,
  output: ProviderTaskOutput,
  index: number,
): { asset: ProjectAsset; download: ExportDownload } {
  const downloadStatus = providerOutputDownloadStatus(workflow, output)
  const assetId = providerOutputAssetId(output, input.providerTaskId, index)
  const sourceIds = mergeIds([
    ...(output.sourceTrackId ? [output.sourceTrackId] : []),
    input.providerTaskId,
  ])
  const tags = mergeIds(['download', output.kind, ...(output.stemName ? [output.stemName] : [])])
  const asset: ProjectAsset = {
    id: assetId,
    kind: providerOutputAssetKind(output.kind),
    label: output.label,
    status: downloadStatus === 'ready' ? 'available' : downloadStatus,
    source: 'provider',
    providerAction: input.action,
    authBoundary: 'server',
    sourceIds,
    tags,
  }
  const download: ExportDownload = {
    id: `download-${sanitizeId(input.providerTaskId)}-${index + 1}`,
    kind: output.kind,
    status: downloadStatus,
    assetId,
    label: output.label,
    url: output.url,
    sourceTrackId: output.sourceTrackId,
    providerTaskId: input.providerTaskId,
    message: downloadStatus === 'blocked'
      ? 'Video download blocked until perfect lipsync QA is ready'
      : input.message,
    receiptId: input.receiptId,
  }

  return { asset, download }
}

function providerOutputDownloadStatus(
  workflow: SunoWorkflow,
  output: ProviderTaskOutput,
): ExportDownloadStatus {
  if (output.kind === 'video' && !isVideoOutputApproved(workflow, output)) {
    return 'blocked'
  }
  return 'ready'
}

function isVideoOutputApproved(workflow: SunoWorkflow, output: ProviderTaskOutput): boolean {
  const lane = workflow.musicVideoLane
  if (!lane || !isPerfectLipsyncApproved(lane)) {
    return false
  }
  if (output.sourceTrackId && output.sourceTrackId !== lane.sourceTrackId) {
    return false
  }
  return true
}

function providerOutputAssetKind(kind: ExportOutputKind): ProjectAssetKind {
  if (kind === 'audio') {
    return 'generated-audio'
  }
  if (kind === 'video') {
    return 'video-output'
  }
  return kind
}

function providerOutputAssetId(output: ProviderTaskOutput, providerTaskId: string, index: number): string {
  return `asset-${providerOutputAssetKind(output.kind)}-${sanitizeId(providerTaskId)}-${index + 1}`
}

function upsertProjectAssets(current: ProjectAsset[], next: ProjectAsset[]): ProjectAsset[] {
  return next.reduce(
    (assets, asset) =>
      assets.some((candidate) => candidate.id === asset.id)
        ? assets.map((candidate) => (candidate.id === asset.id ? asset : candidate))
        : [...assets, asset],
    current,
  )
}

function upsertExportTask(current: ExportTask[], task: ExportTask): ExportTask[] {
  return current.some((candidate) => candidate.id === task.id)
    ? current.map((candidate) => (candidate.id === task.id ? task : candidate))
    : [...current, task]
}

function upsertExportDownloads(current: ExportDownload[], downloads: ExportDownload[]): ExportDownload[] {
  return downloads.reduce(
    (items, download) =>
      items.some((candidate) => candidate.id === download.id)
        ? items.map((candidate) => (candidate.id === download.id ? download : candidate))
        : [...items, download],
    current,
  )
}

function upsertProviderCallback(
  current: ProviderCallbackReceipt[],
  callback: ProviderCallbackReceipt,
): ProviderCallbackReceipt[] {
  return current.some((candidate) => candidate.id === callback.id)
    ? current.map((candidate) => (candidate.id === callback.id ? callback : candidate))
    : [...current, callback]
}

function createProviderJob(workflow: SunoWorkflow, result: ProviderJobResultInput): ProviderJob {
  return {
    id: `job-${workflow.jobQueue.length + 1}`,
    action: result.action,
    capability: result.capability,
    outcome: result.outcome,
    status: providerOutcomeToJobStatus(result.outcome),
    message: result.message,
    authBoundary: result.authBoundary,
    endpoint: result.endpoint,
    providerTaskId: result.providerTaskId,
    receiptId: result.receiptId,
    sourceTrackId: workflow.selectedTrack?.id ?? workflow.musicVideoLane?.sourceTrackId,
  }
}

function upsertProviderJob(current: ProviderJob[], next: ProviderJob): ProviderJob[] {
  const existingIndex = current.findIndex(
    (job) =>
      job.receiptId === next.receiptId ||
      (Boolean(job.providerTaskId) && job.providerTaskId === next.providerTaskId && job.action === next.action),
  )
  if (existingIndex === -1) {
    return [...current, next]
  }

  return current.map((job, index) => (index === existingIndex ? { ...next, id: job.id } : job))
}

function upsertVoicePersona(
  state: VoicePersonaState,
  asset: ProjectAsset,
  receiptId: string,
): VoicePersonaState {
  const persona: VoicePersona = {
    id: 'persona-provider',
    label: asset.label,
    consentNote: asset.consentNote ?? '',
    tags: asset.tags,
    assetId: asset.id,
    providerStatus: asset.status,
    actionReceipts: [receiptId],
  }

  return {
    activePersonaId: persona.id,
    personas: [
      ...state.personas.filter((candidate) => candidate.id !== persona.id),
      persona,
    ],
  }
}

function assetIdsForWorkflow(workflow: SunoWorkflow): string[] {
  return workflow.projectAssets.items.map((asset) => asset.id)
}

function mergeIds(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function sanitizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function appendOnce(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value]
}
