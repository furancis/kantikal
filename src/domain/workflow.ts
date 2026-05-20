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

const lipsyncCheckNames = ['phoneme', 'frame', 'mouthShape', 'segmentDrift', 'postStitch'] as const

export type LipsyncCheckName = (typeof lipsyncCheckNames)[number]

export type LipsyncChecks = Record<LipsyncCheckName, boolean>

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
  repairAttempts: LipsyncRepairAttempt[]
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

export type SunoWorkflow = BriefInput & {
  stage: WorkflowStage
  generationBatch: GenerationBatch | null
  selectedTrack: GeneratedTrack | null
  musicVideoLane: MusicVideoLane | null
  taste: TasteState
  songLab: SongLab | null
  jobQueue: ProviderJob[]
  localLibrary: LocalLibraryState
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
  const job: ProviderJob = {
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

  return {
    ...workflow,
    jobQueue: [...workflow.jobQueue, job],
    provenance: appendOnce(workflow.provenance, 'provider-job-result'),
  }
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

  return {
    ...workflow,
    stage: 'video-open',
    musicVideoLane: {
      sourceTrackId: selectedTrack.id,
      exportStatus: 'blocked',
      lipsync: null,
      repairAttempts: [],
      scenes: createMusicVideoScenes(selectedTrack, sectionSource),
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

  const renderPlan: ComfyRenderPlan = {
    id: `comfy-${workflow.musicVideoLane.sourceTrackId}`,
    sourceTrackId: workflow.musicVideoLane.sourceTrackId,
    model: input.model,
    seed: input.seed,
    referenceAssetIds: input.referenceAssetIds,
    nodes: createComfyRenderGraphNodes(
      input.model,
      input.seed,
      input.referenceAssetIds,
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
): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('Lipsync QA requires an open music video lane')
  }

  const exportStatus = failedLipsyncChecks(lipsync).length === 0 ? 'ready' : 'blocked'
  const activeFailureRanges =
    exportStatus === 'ready'
      ? []
      : failureRanges.length > 0
        ? failureRanges
        : deriveLipsyncFailureRanges(workflow.musicVideoLane.scenes, lipsync)

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      exportStatus,
      lipsync,
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

export function failedLipsyncChecks(lipsync: LipsyncChecks): LipsyncCheckName[] {
  return lipsyncCheckNames.filter((checkName) => !lipsync[checkName])
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
    if (workflow.musicVideoLane.exportStatus !== 'ready') {
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
    receipts.push({
      id: `receipt-video-${selectedTrack.id}`,
      action: 'lipsync-qa-passed',
      detail: 'Music-video export passed all hard lipsync checks',
      sourceIds: [selectedTrack.id],
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

function createMusicVideoScenes(track: GeneratedTrack, sections: SongLabSection[]): MusicVideoScene[] {
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
    assetRefs: [`audio:${track.id}`, `section:${section.id}`],
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

function appendOnce(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value]
}
