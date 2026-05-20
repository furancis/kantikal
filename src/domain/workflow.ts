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

export type SunoWorkflow = BriefInput & {
  stage: WorkflowStage
  generationBatch: GenerationBatch | null
  selectedTrack: GeneratedTrack | null
  musicVideoLane: MusicVideoLane | null
  provenance: string[]
}

export type ReleasePack = {
  trackId: string
  includesVideo: boolean
  provenance: string[]
}

export function createWorkflow(input: BriefInput): SunoWorkflow {
  return {
    ...input,
    stage: 'brief-ready',
    generationBatch: null,
    selectedTrack: null,
    musicVideoLane: null,
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
    provenance: appendOnce(workflow.provenance, 'release-pack'),
  }
}

function appendOnce(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value]
}
