export type WorkflowStage =
  | 'brief-ready'
  | 'batch-ready'
  | 'track-selected'
  | 'video-open'
  | 'release-ready'

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

export type LipsyncChecks = {
  phoneme: boolean
  frame: boolean
  mouthShape: boolean
  segmentDrift: boolean
  postStitch: boolean
}

export type MusicVideoLane = {
  sourceTrackId: string
  exportStatus: 'blocked' | 'ready'
  lipsync: LipsyncChecks | null
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

  const exportStatus = Object.values(lipsync).every(Boolean) ? 'ready' : 'blocked'

  return {
    ...workflow,
    musicVideoLane: {
      ...workflow.musicVideoLane,
      exportStatus,
      lipsync,
    },
    provenance: exportStatus === 'ready' ? appendOnce(workflow.provenance, 'lipsync-qa') : workflow.provenance,
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
