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

const lipsyncCheckNames = ['phoneme', 'frame', 'mouthShape', 'segmentDrift', 'postStitch'] as const

export type LipsyncCheckName = (typeof lipsyncCheckNames)[number]

export type LipsyncChecks = Record<LipsyncCheckName, boolean>

export type LipsyncRepairAttempt = {
  id: string
  failedChecks: LipsyncCheckName[]
  action: string
  status: 'queued' | 'applied'
}

export type MusicVideoLane = {
  sourceTrackId: string
  exportStatus: 'blocked' | 'ready'
  lipsync: LipsyncChecks | null
  repairAttempts: LipsyncRepairAttempt[]
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
    cleanupPlan: null,
    provenance: appendOnce(workflow.provenance, 'selected-track'),
  }
}

export function openMusicVideoLane(workflow: SunoWorkflow): SunoWorkflow {
  if (!workflow.selectedTrack) {
    throw new Error('Music video lane requires a selected track')
  }

  return {
    ...workflow,
    stage: 'video-open',
    musicVideoLane: {
      sourceTrackId: workflow.selectedTrack.id,
      exportStatus: 'blocked',
      lipsync: null,
      repairAttempts: [],
    },
  }
}

export function evaluateLipsync(
  workflow: SunoWorkflow,
  lipsync: LipsyncChecks,
): SunoWorkflow {
  if (!workflow.musicVideoLane) {
    throw new Error('Lipsync QA requires an open music video lane')
  }

  const exportStatus = failedLipsyncChecks(lipsync).length === 0 ? 'ready' : 'blocked'

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      exportStatus,
      lipsync,
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

function appendOnce(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value]
}
