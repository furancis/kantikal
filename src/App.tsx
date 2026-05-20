import {
  Activity,
  Archive,
  Bot,
  Boxes,
  Clapperboard,
  Download,
  FileAudio,
  FileText,
  Gauge,
  GitBranch,
  KeyRound,
  Library,
  Mic2,
  Play,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Video,
  WandSparkles,
  Waves,
} from 'lucide-react'
import type { ChangeEvent, ComponentType, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { actionStateForEntry } from './api/actionCatalog'
import type { ApiCoverageEntry } from './api/coverage'
import { apiCoverageEntries, apiCoverageStatusCounts } from './api/coverage'
import {
  createLocalProviderExportRuntimeClient,
  type ProviderExportRuntimeClient,
} from './api/exportRuntime'
import { mergeProviderExportSnapshot, type ProviderExportSnapshot } from './api/exportState'
import {
  createBrowserProjectStore,
  projectSnapshotFromState,
  type ProjectStore,
  type ProjectSummary,
} from './api/projectStore'
import { createMockSunoProvider, executeProviderAction } from './api/provider'
import type { ProviderActionResult, SunoProvider } from './api/provider'
import {
  applyArchiveFirstCleanup,
  compareTracks,
  createWorkflow,
  evaluateLipsync,
  failedLipsyncChecks,
  lockSongLabRegion,
  openSongLab,
  openMusicVideoLane,
  planComfyRenderGraph,
  planArchiveFirstCleanup,
  recordProjectAssetImport,
  queueSongLabEdit,
  queueLipsyncRepair,
  queueMusicVideoRender,
  rateTrack,
  recordProviderJobResult,
  restoreArchivedTracks,
  saveSelectedTrackToLocalLibrary,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
  type BriefInput,
  type GeneratedTrack,
  type LipsyncCheckName,
  type LipsyncChecks,
  type ProjectAssetKind,
  type ReleasePack,
  type SunoWorkflow,
} from './domain/workflow'

type NodeStatus = 'draft' | 'generating' | 'needs-review' | 'locked' | 'exported' | 'ready'
type NodeKind =
  | 'project'
  | 'brief'
  | 'lyrics'
  | 'style'
  | 'voice'
  | 'assets'
  | 'batch'
  | 'generated'
  | 'track'
  | 'stem'
  | 'compare'
  | 'songlab'
  | 'queue'
  | 'library'
  | 'downloads'
  | 'video'
  | 'export'

type WorkflowNode = {
  id: string
  kind: NodeKind
  title: string
  summary: string
  status: NodeStatus
  x: number
  y: number
  meta: string[]
  trackId?: string
}

const initialBrief: BriefInput = {
  brief: 'Arabic club-pop hook, bilingual chorus, dark cinematic lift',
  lyrics: 'Verse, pre, chorus, bridge with syllable density markers',
  style: 'Gulf percussion, polished electro-pop, restrained vocal glaze',
  voice: 'Reusable vocal identity with prompt-safe consent notes',
}

const statusLabel: Record<NodeStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  'needs-review': 'Needs review',
  locked: 'Locked',
  exported: 'Exported',
  ready: 'Ready',
}

const lipsyncCheckOrder: LipsyncCheckName[] = [
  'phoneme',
  'frame',
  'mouthShape',
  'segmentDrift',
  'postStitch',
]

const lipsyncCheckLabels: Record<LipsyncCheckName, string> = {
  phoneme: 'Phoneme lock',
  frame: 'Frame timing',
  mouthShape: 'Mouth shape',
  segmentDrift: 'Segment drift',
  postStitch: 'Post-stitch sync',
}

const lipsyncRepairLabels: Record<LipsyncCheckName, string> = {
  phoneme: 'phoneme',
  frame: 'frame',
  mouthShape: 'mouth shape',
  segmentDrift: 'segment drift',
  postStitch: 'post-stitch',
}

const firstPassLipsyncChecks: LipsyncChecks = {
  phoneme: true,
  frame: true,
  mouthShape: true,
  segmentDrift: false,
  postStitch: false,
}

const passingLipsyncChecks: LipsyncChecks = {
  phoneme: true,
  frame: true,
  mouthShape: true,
  segmentDrift: true,
  postStitch: true,
}

const iconByKind: Record<NodeKind, ComponentType<{ size?: number }>> = {
  project: Boxes,
  brief: FileText,
  lyrics: Mic2,
  style: SlidersHorizontal,
  voice: Bot,
  assets: Boxes,
  batch: Sparkles,
  generated: FileAudio,
  track: FileAudio,
  stem: Waves,
  compare: GitBranch,
  songlab: Waves,
  queue: Activity,
  library: Library,
  downloads: Download,
  video: Video,
  export: Download,
}

const featureList = [
  'Visual node canvas for idea to release workflow',
  'Prompt, lyrics, style, voice and persona workbenches',
  'Full Suno API parity map with unsupported endpoints explicitly flagged',
  'Batch generation, version lineage, A/B comparison and taste scoring',
  'Song Lab timeline with regions, sections, stems and arrangement locks',
  'Music video lane as a subfeature, not the main product',
  'ComfyUI render planning, scene cards and asset routing',
  'Perfect lipsync gate with phoneme/frame drift detection and repair loop',
  'Archive-first destructive cleanup with undo, receipts and audit trail',
  'Release pack export for audio, video, metadata, prompts and provenance',
]

type AppProps = {
  provider?: SunoProvider
  exportRuntime?: ProviderExportRuntimeClient
  projectStore?: ProjectStore
  projectId?: string
}

type ProjectAssetAction = {
  kind: ProjectAssetKind
  label: string
  action: string
  capability: string
  sourceIds: string[]
  tags: string[]
  consentNote?: string
}

const defaultProjectId = 'default-project'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function App({
  provider: injectedProvider,
  exportRuntime: injectedExportRuntime,
  projectStore: injectedProjectStore,
  projectId = defaultProjectId,
}: AppProps = {}) {
  const mockProvider = useMemo(() => createMockSunoProvider(), [])
  const localExportRuntime = useMemo(() => createLocalProviderExportRuntimeClient(), [])
  const localProjectStore = useMemo(() => createBrowserProjectStore(), [])
  const provider = injectedProvider ?? mockProvider
  const exportRuntime = injectedExportRuntime ?? localExportRuntime
  const projectStore = injectedProjectStore ?? localProjectStore
  const coverageCounts = useMemo(() => apiCoverageStatusCounts(apiCoverageEntries), [])
  const [activeProjectId, setActiveProjectId] = useState(projectId)
  const [projectHydrated, setProjectHydrated] = useState(false)
  const [projectStoreError, setProjectStoreError] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])
  const [briefInput, setBriefInput] = useState<BriefInput>(initialBrief)
  const [workflow, setWorkflow] = useState<SunoWorkflow>(() => createWorkflow(initialBrief))
  const [releasePack, setReleasePack] = useState<ReleasePack | null>(null)
  const [selectedId, setSelectedId] = useState('project-lobby')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [videoExportError, setVideoExportError] = useState<string | null>(null)
  const [exportRuntimeError, setExportRuntimeError] = useState<string | null>(null)
  const [apiActionResult, setApiActionResult] = useState<ProviderActionResult | null>(null)

  const workflowNodes = useMemo(
    () => buildWorkflowNodes(workflow, releasePack, recentProjects, activeProjectId),
    [workflow, releasePack, recentProjects, activeProjectId],
  )
  const selected = workflowNodes.find((node) => node.id === selectedId) ?? workflowNodes[0]

  useEffect(() => {
    setActiveProjectId(projectId)
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    setProjectHydrated(false)
    setProjectStoreError(null)
    void projectStore
      .loadProject(activeProjectId)
      .then((snapshot) => {
        if (cancelled) {
          return
        }
        if (snapshot) {
          setBriefInput(snapshot.briefInput)
          setWorkflow(snapshot.workflow)
          setReleasePack(snapshot.releasePack)
          setSelectedId('project-lobby')
        }
        setProjectHydrated(true)
      })
      .then(() => projectStore.listProjects())
      .then((projects) => {
        if (!cancelled) {
          setRecentProjects(projects)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProjectStoreError(errorMessage(error, 'Project hydration failed'))
          setProjectHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeProjectId, projectStore])

  useEffect(() => {
    if (!projectHydrated) {
      return
    }
    let cancelled = false
    void projectStore
      .saveProject(projectSnapshotFromState({
        projectId: activeProjectId,
        briefInput,
        workflow,
        releasePack,
      }))
      .then(() => projectStore.listProjects())
      .then((projects) => {
        if (!cancelled) {
          setProjectStoreError(null)
          setRecentProjects(projects)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProjectStoreError(errorMessage(error, 'Project save failed'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeProjectId, briefInput, projectHydrated, projectStore, releasePack, workflow])

  useEffect(() => {
    if (!projectHydrated) {
      return
    }
    let cancelled = false
    void exportRuntime
      .hydrate(activeProjectId)
      .then((snapshot) => {
        if (cancelled) {
          return
        }
        setExportRuntimeError(null)
        if (snapshot) {
          setWorkflow((current) => mergeProviderExportSnapshot(current, snapshot))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setExportRuntimeError(errorMessage(error, 'Provider export hydration failed'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeProjectId, exportRuntime, projectHydrated])
  const SelectedIcon = iconByKind[selected.kind]
  const canOpenVideo = Boolean(workflow.selectedTrack) && !workflow.musicVideoLane
  const activeLipsync = workflow.musicVideoLane?.lipsync ?? null
  const failedVideoChecks = activeLipsync ? failedLipsyncChecks(activeLipsync) : []
  const lipsyncReadyCount = activeLipsync ? lipsyncCheckOrder.length - failedVideoChecks.length : 0
  const lipsyncReadinessPercent = Math.round((lipsyncReadyCount / lipsyncCheckOrder.length) * 100)
  const videoExportReady = workflow.musicVideoLane?.exportStatus === 'ready'
  const cleanupTargets = discardedGeneratedTracks(workflow)
  const cleanupStatus = workflow.cleanupPlan?.status ?? 'idle'
  const promptLocked = isGenerating || Boolean(workflow.musicVideoLane)

  async function handleGenerate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setIsGenerating(true)
    setGenerateError(null)
    setVideoExportError(null)
    try {
      const generationBatch = await provider.generateBatch({
        ...briefInput,
        count: 2,
      })
      if (generationBatch.tracks.length === 0) {
        throw new Error('Generation batch requires at least one track')
      }
      setReleasePack(null)
      setWorkflow((current) => {
        const baseWorkflow = {
          ...createWorkflow(briefInput),
          projectAssets: current.projectAssets,
          voicePersonas: current.voicePersonas,
          exports: current.exports,
          jobQueue: current.jobQueue,
          provenance: current.provenance,
        }
        return submitGenerationBatch(baseWorkflow, generationBatch)
      })
      setSelectedId('batch')
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRunApiAction(entry: ApiCoverageEntry) {
    const actionState = actionStateForEntry(entry)
    try {
      const result = await executeProviderAction(provider, {
        action: entry.adapterAction,
        capability: entry.capability,
        brief: briefInput.brief,
        lyrics: briefInput.lyrics,
        style: briefInput.style,
        voice: briefInput.voice,
        payload: {
          prompt: briefInput.lyrics || briefInput.brief,
          style: briefInput.style,
          title: briefInput.brief,
        },
      })
      handleProviderActionResult(result)
    } catch (error) {
      handleProviderActionResult({
        action: entry.adapterAction,
        capability: entry.capability,
        outcome: 'blocked',
        message: error instanceof Error ? error.message : 'Provider action failed',
        authBoundary: actionState.authBoundary,
        endpoint: actionState.path,
        receiptId: `provider-action-error-${entry.adapterAction}`,
      })
    }
  }

  function handleProviderActionResult(result: ProviderActionResult) {
    setApiActionResult(result)
    setWorkflow((current) => recordProviderJobResult(current, result))
  }

  async function handleImportProjectAsset(input: ProjectAssetAction) {
    try {
      const result = await executeProviderAction(provider, {
        action: input.action,
        capability: input.capability,
        brief: briefInput.brief,
        lyrics: briefInput.lyrics,
        style: briefInput.style,
        voice: briefInput.voice,
        payload: {
          label: input.label,
          sourceIds: input.sourceIds,
          tags: input.tags,
        },
      })
      setApiActionResult(result)
      setWorkflow((current) =>
        recordProjectAssetImport(
          current,
          {
            kind: input.kind,
            label: input.label,
            sourceIds: input.sourceIds,
            tags: input.tags,
            consentNote: input.consentNote,
          },
          result,
        ),
      )
      setSelectedId(input.kind === 'persona-reference' ? 'voice' : 'project-assets')
    } catch (error) {
      const result: ProviderActionResult = {
        action: input.action,
        capability: input.capability,
        outcome: 'blocked',
        message: error instanceof Error ? error.message : 'Project asset action failed',
        authBoundary: 'server',
        receiptId: `asset-action-error-${input.action}`,
      }
      setApiActionResult(result)
      setWorkflow((current) =>
        recordProjectAssetImport(
          current,
          {
            kind: input.kind,
            label: input.label,
            sourceIds: input.sourceIds,
            tags: input.tags,
            consentNote: input.consentNote,
          },
          result,
        ),
      )
      setSelectedId(input.kind === 'persona-reference' ? 'voice' : 'project-assets')
    }
  }

  async function handlePollSelectedGenerationJob() {
    await handleProviderExportAction(() => exportRuntime.pollGenerationTask({ projectId: activeProjectId, workflow }))
  }

  async function handleReceiveFailedCallback() {
    await handleProviderExportAction(() => exportRuntime.receiveFailedCallback({ projectId: activeProjectId, workflow }))
  }

  async function handleRecordProviderVideoOutput() {
    await handleProviderExportAction(() => exportRuntime.recordProviderVideoOutput({ projectId: activeProjectId, workflow }))
  }

  async function handleProviderExportAction(action: () => Promise<ProviderExportSnapshot>) {
    setExportRuntimeError(null)
    try {
      const snapshot = await action()
      setWorkflow((current) => mergeProviderExportSnapshot(current, snapshot))
    } catch (error) {
      setExportRuntimeError(errorMessage(error, 'Provider export action failed'))
    } finally {
      setSelectedId('downloads')
    }
  }

  function handleFieldChange(field: keyof BriefInput) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (workflow.musicVideoLane) {
        return
      }
      const value = event.target.value
      setBriefInput((current) => ({ ...current, [field]: value }))
      setWorkflow((current) => ({
        ...createWorkflow({
          brief: current.brief,
          lyrics: current.lyrics,
          style: current.style,
          voice: current.voice,
          [field]: value,
        }),
      }))
      setReleasePack(null)
      setGenerateError(null)
      setVideoExportError(null)
      setSelectedId('brief')
    }
  }

  function handleNodeSelect(node: WorkflowNode) {
    if (node.kind === 'generated' && node.trackId) {
      const trackId = node.trackId
      const isSameSelectedTrack = workflow.selectedTrack?.id === trackId
      setWorkflow((current) => (current.selectedTrack?.id === trackId ? current : selectTrack(current, trackId)))
      setReleasePack((current) => (isSameSelectedTrack ? current : null))
      setVideoExportError(null)
      setSelectedId('track')
      return
    }

    setSelectedId(node.id)
  }

  function handleOpenProject(nextProjectId: string) {
    if (nextProjectId === activeProjectId) {
      setSelectedId('project-lobby')
      return
    }
    setActiveProjectId(nextProjectId)
    setSelectedId('project-lobby')
  }

  function handleOpenVideoLane() {
    setWorkflow((current) => openMusicVideoLane(current))
    setVideoExportError(null)
    setSelectedId('video')
  }

  function handlePlanComfyRenderGraph() {
    setWorkflow((current) =>
      planComfyRenderGraph(current, {
        model: 'wan-video-lipsync',
        seed: 4242,
        referenceAssetIds: ['persona-ref', 'cover-ref'],
      }),
    )
    setSelectedId('video')
  }

  function handleQueueMusicVideoRender() {
    setWorkflow((current) => queueMusicVideoRender(current))
    setSelectedId('video')
  }

  function handleRateTrack(track: GeneratedTrack) {
    setWorkflow((current) =>
      rateTrack(current, track.id, {
        score: 5,
        notes: `${track.title} marked as a taste match`,
        tags: ['taste-match', 'release-candidate'],
      }),
    )
    setSelectedId('version-comparison')
  }

  function handleCompareGeneratedTracks() {
    const tracks = workflow.generationBatch?.tracks ?? []
    if (tracks.length < 2) {
      return
    }
    const [leftTrack, rightTrack] = tracks
    const winnerTrackId =
      workflow.selectedTrack && [leftTrack.id, rightTrack.id].includes(workflow.selectedTrack.id)
        ? workflow.selectedTrack.id
        : rightTrack.id
    setWorkflow((current) =>
      compareTracks(current, {
        leftTrackId: leftTrack.id,
        rightTrackId: rightTrack.id,
        winnerTrackId,
        notes: `${winnerTrackId} is the stronger release candidate from this batch`,
      }),
    )
    setSelectedId('version-comparison')
  }

  function handleOpenSongLab() {
    setWorkflow((current) => openSongLab(current))
    setSelectedId('song-lab')
  }

  function handleLockHookRegion() {
    setWorkflow((current) => lockSongLabRegion(current, 'hook'))
    setSelectedId('song-lab')
  }

  function handleQueueReplaceSection() {
    setWorkflow((current) =>
      queueSongLabEdit(current, {
        sectionId: 'hook',
        action: 'replaceSection',
        label: 'Replace hook with cleaner bilingual lift',
      }),
    )
    setSelectedId('song-lab')
  }

  function handleSaveSelectedToLocalLibrary() {
    setWorkflow((current) =>
      saveSelectedTrackToLocalLibrary(current, {
        notes: 'Selected source saved to local project library',
        tags: ['local-library', 'keeper'],
      }),
    )
    setSelectedId('local-library')
  }

  function handleCreateReleasePack() {
    const nextReleasePack = toReleasePack(workflow, { includeVideo: false })
    setReleasePack(nextReleasePack)
    setVideoExportError(null)
    setSelectedId('export')
  }

  function handleRunLipsyncQa() {
    setWorkflow((current) => {
      const hasQueuedRepair =
        current.musicVideoLane?.repairAttempts.some((attempt) => attempt.status === 'queued') ?? false
      return evaluateLipsync(current, hasQueuedRepair ? passingLipsyncChecks : firstPassLipsyncChecks)
    })
    setVideoExportError(null)
    setSelectedId('video')
  }

  function handleQueueLipsyncRepair() {
    setWorkflow((current) => queueLipsyncRepair(current))
    setVideoExportError(null)
    setSelectedId('video')
  }

  function handleCreateVideoReleasePack() {
    try {
      const nextReleasePack = toReleasePack(workflow, { includeVideo: true })
      setReleasePack(nextReleasePack)
      setVideoExportError(null)
      setSelectedId('export')
    } catch (error) {
      setVideoExportError(error instanceof Error ? error.message : 'Video release is blocked')
      setSelectedId('video')
    }
  }

  function handlePlanArchiveFirstCleanup() {
    setWorkflow((current) => {
      const targetTrackIds = discardedGeneratedTracks(current).map((track) => track.id)
      return planArchiveFirstCleanup(current, targetTrackIds, 'discard unselected generated takes')
    })
  }

  function handleApplyCleanup() {
    setWorkflow((current) => applyArchiveFirstCleanup(current))
  }

  function handleRestoreArchivedTracks() {
    setWorkflow((current) => restoreArchivedTracks(current))
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Suno Visual Studio</p>
          <h1>Visual music generation operating app</h1>
          <p className="project-current">Current project: {activeProjectId}</p>
        </div>
        <div className="topbar-actions" aria-label="Project controls">
          <button aria-label="Open project lobby" onClick={() => setSelectedId('project-lobby')}>
            <Boxes size={16} />
            Projects
          </button>
          <button aria-label="Run generation" disabled={promptLocked} onClick={() => void handleGenerate()}>
            <Play size={16} />
            Run
          </button>
          <button aria-label="Open API coverage" onClick={() => setSelectedId('api-coverage')}>
            <ShieldCheck size={16} />
            API parity
          </button>
          <button aria-label="Open settings">
            <KeyRound size={16} />
            Secrets
          </button>
        </div>
      </header>
      {exportRuntimeError && (
        <p className="form-error" role="alert">
          {exportRuntimeError}
        </p>
      )}
      {projectStoreError && (
        <p className="form-error" role="alert">
          {projectStoreError}
        </p>
      )}

      <section className="workspace" aria-label="Suno workflow workspace">
        <aside className="prompt-rail">
          <div className="rail-block active">
            <WandSparkles size={18} />
            <span>Prompt board</span>
          </div>
          <form className="prompt-form" onSubmit={(event) => void handleGenerate(event)}>
            <label>
              <span>Brief</span>
              <textarea value={briefInput.brief} onChange={handleFieldChange('brief')} disabled={promptLocked} />
            </label>
            <label>
              <span>Lyrics</span>
              <textarea value={briefInput.lyrics} onChange={handleFieldChange('lyrics')} disabled={promptLocked} />
            </label>
            <label>
              <span>Style</span>
              <input value={briefInput.style} onChange={handleFieldChange('style')} disabled={promptLocked} />
            </label>
            <label>
              <span>Voice</span>
              <input value={briefInput.voice} onChange={handleFieldChange('voice')} disabled={promptLocked} />
            </label>
            <button type="submit" aria-label="Generate Suno batch" disabled={promptLocked}>
              <Sparkles size={16} />
              {isGenerating ? 'Generating' : 'Generate Suno batch'}
            </button>
            {generateError && (
              <p className="form-error" role="alert">
                {generateError}
              </p>
            )}
          </form>
          <div className="rail-block">
            <Library size={18} />
            <span>Library</span>
          </div>
          <div className="rail-block">
            <Clapperboard size={18} />
            <span>Video lane</span>
          </div>
          <div className="rail-block">
            <Archive size={18} />
            <span>Archive</span>
          </div>
          <div className="agent-stack" aria-label="Agent lanes">
            <p>Agent lanes</p>
            <span>Lyrics</span>
            <span>Arrangement</span>
            <span>Visuals</span>
            <span>Release copy</span>
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-header">
            <div>
              <p className="eyebrow">Project graph</p>
              <h2>Idea to song to video to release</h2>
            </div>
            <div className="health-strip">
              <span>
                <Activity size={14} />
                {workflow.stage}
              </span>
              <span>
                <Gauge size={14} />
                Mock cost guard
              </span>
              <span>
                <GitBranch size={14} />
                {workflow.provenance.length} receipts
              </span>
            </div>
          </div>

          <div className="canvas" role="list" aria-label="Workflow cards">
            <svg className="edges" aria-hidden="true" viewBox="0 0 100 80" preserveAspectRatio="none">
              <path d="M16 25 C27 11 34 18 45 24 S59 20 70 29 S81 36 88 42" />
              <path d="M36 44 C45 48 52 54 64 58 S79 58 88 68" />
              <path d="M74 31 C76 43 78 50 86 58" />
            </svg>
            {workflowNodes.map((node) => {
              const Icon = iconByKind[node.kind]
              return (
                <button
                  aria-label={`${node.title}: ${node.summary}`}
                  className={`node-card ${selected.id === node.id ? 'selected' : ''}`}
                  key={node.id}
                  onClick={() => handleNodeSelect(node)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <span className={`status ${node.status}`}>{statusLabel[node.status]}</span>
                  <Icon size={20} />
                  <strong>{node.title}</strong>
                  <small>{node.summary}</small>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-head">
            <SelectedIcon size={24} />
            <div>
              <p className="eyebrow">Inspector</p>
              <h2>{selected.title}</h2>
            </div>
          </div>
          <p>{selected.summary}</p>
          <div className="meta-list">
            {selected.meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {selected.kind === 'project' && (
            <div className="workflow-section">
              <h3>Recent projects</h3>
              <p>Current project: {activeProjectId}</p>
              <div className="project-list" aria-label="Recent projects">
                {recentProjects.length === 0 ? (
                  <div>
                    <strong>No saved project snapshots yet</strong>
                    <small>The current workspace will appear here after the first project save.</small>
                  </div>
                ) : (
                  recentProjects.map((project) => (
                    <button
                      className={project.projectId === activeProjectId ? 'active' : ''}
                      key={project.projectId}
                      onClick={() => handleOpenProject(project.projectId)}
                      type="button"
                    >
                      <strong>{project.brief}</strong>
                      <small>
                        {project.projectId}; selected track {project.selectedTrackId ?? 'none'}; {project.jobCount} jobs;{' '}
                        {project.exportCount} exports; {project.blockedGateCount} blocked gates; release{' '}
                        {project.releasePackLabel}
                      </small>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          {selected.kind === 'track' && workflow.selectedTrack && (
            <div className="action-box">
              <p>Selected source: {workflow.selectedTrack.id}</p>
              <button type="button" onClick={handleCreateReleasePack}>
                <Download size={16} />
                Create audio release pack
              </button>
              <button type="button" onClick={handleOpenSongLab}>
                <Waves size={16} />
                Open Song Lab
              </button>
              <button type="button" onClick={handleSaveSelectedToLocalLibrary}>
                <Library size={16} />
                Save selected to local library
              </button>
            </div>
          )}
          {selected.kind === 'voice' && (
            <div className="workflow-section">
              <h3>Persona workbench</h3>
              <p>Active persona: {workflow.voicePersonas.activePersonaId ?? 'none'}</p>
              <div className="persona-list" aria-label="Voice personas">
                {workflow.voicePersonas.personas.map((persona) => (
                  <div key={persona.id}>
                    <strong>
                      {persona.label} {persona.providerStatus}
                    </strong>
                    <small>
                      Consent note: {persona.consentNote}; asset {persona.assetId}
                    </small>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  void handleImportProjectAsset({
                    kind: 'persona-reference',
                    label: 'Consented bright tenor persona',
                    action: 'createCustomVoice',
                    capability: 'Custom voice creation',
                    sourceIds: ['voice'],
                    tags: ['consent', 'voice', 'prompt-safe'],
                    consentNote: briefInput.voice,
                  })
                }
              >
                <Mic2 size={16} />
                Create persona reference
              </button>
            </div>
          )}
          {selected.kind === 'assets' && (
            <div className="workflow-section">
              <h3>Project asset library</h3>
              <p>
                Source assets are project evidence. Provider-backed imports show completed, planned, or blocked states
                from the active server/worker lane.
              </p>
              <div className="asset-list" aria-label="Project assets">
                {workflow.projectAssets.items.map((asset) => (
                  <div className={asset.status} key={asset.id}>
                    <strong>
                      {asset.id} {asset.status}
                    </strong>
                    <small>
                      {asset.kind}; {asset.label}; {asset.authBoundary}
                    </small>
                  </div>
                ))}
              </div>
              <div className="gate-actions">
                <button
                  type="button"
                  onClick={() =>
                    void handleImportProjectAsset({
                      kind: 'reference-audio',
                      label: 'Hook guide reference audio',
                      action: 'uploadReferenceAudio',
                      capability: 'Upload/reference audio',
                      sourceIds: ['brief'],
                      tags: ['reference', 'upload'],
                    })
                  }
                >
                  <FileAudio size={16} />
                  Import reference audio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleImportProjectAsset({
                      kind: 'cover-art',
                      label: 'Release cover art direction',
                      action: 'generateCoverArt',
                      capability: 'Cover art',
                      sourceIds: ['style'],
                      tags: ['cover', 'release'],
                    })
                  }
                >
                  <Sparkles size={16} />
                  Generate cover art asset
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleImportProjectAsset({
                      kind: 'video-reference',
                      label: 'Performance framing reference',
                      action: 'renderMusicVideo',
                      capability: 'Music-video render',
                      sourceIds: ['brief'],
                      tags: ['video', 'reference'],
                    })
                  }
                >
                  <Video size={16} />
                  Plan video reference
                </button>
              </div>
              {workflow.projectAssets.imports.length > 0 && (
                <div className="asset-list" aria-label="Project asset import jobs">
                  {workflow.projectAssets.imports.map((job) => (
                    <div className={job.status} key={job.id}>
                      <strong>
                        {job.action} {job.status}
                      </strong>
                      <small>{job.message}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selected.kind === 'compare' && workflow.generationBatch && (
            <div className="workflow-section">
              <h3>Version comparison</h3>
              <p>Rate candidates, record taste notes, and lock a winner without changing the selected source.</p>
              <div className="comparison-list" aria-label="Track taste ratings">
                {workflow.generationBatch.tracks.map((track) => {
                  const rating = workflow.taste.ratings[track.id]
                  return (
                    <div key={track.id}>
                      <strong>{track.id}</strong>
                      <small>
                        {rating
                          ? `Taste score: ${rating.score} - ${rating.notes}`
                          : `${track.title} is unrated`}
                      </small>
                      <button type="button" onClick={() => handleRateTrack(track)}>
                        <Sparkles size={16} />
                        Rate {track.id} as taste match
                      </button>
                    </div>
                  )
                })}
              </div>
              {workflow.generationBatch.tracks.length > 1 && (
                <button type="button" onClick={handleCompareGeneratedTracks}>
                  <GitBranch size={16} />
                  Compare {workflow.generationBatch.tracks[0].id} vs {workflow.generationBatch.tracks[1].id}
                </button>
              )}
              {workflow.taste.comparisons.length > 0 && (
                <div className="comparison-list" aria-label="Version comparison results">
                  {workflow.taste.comparisons.map((comparison) => (
                    <div key={comparison.id}>
                      <strong>
                        winner {comparison.winnerTrackId}
                      </strong>
                      <small>{comparison.notes}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selected.kind === 'songlab' && (
            <div className="workflow-section">
              {workflow.songLab ? (
                <>
                  <p>Source track: {workflow.songLab.sourceTrackId}</p>
                  <p>Source assets: {workflow.songLab.assetRefs.join(', ')}</p>
                  <div className="song-section-list" aria-label="Song Lab sections">
                    {workflow.songLab.sections.map((section) => (
                      <div className={section.locked ? 'locked' : ''} key={section.id}>
                        <strong>
                          {section.label} {section.locked ? 'locked' : 'editable'}
                        </strong>
                        <small>
                          {section.startSeconds}s-{section.endSeconds}s
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="song-section-list" aria-label="Song Lab stems">
                    {workflow.songLab.stems.map((stem) => (
                      <div key={stem.id}>
                        <strong>{stem.label}</strong>
                        <small>{stem.status}</small>
                      </div>
                    ))}
                  </div>
                  <div className="gate-actions">
                    <button type="button" onClick={handleLockHookRegion}>
                      <ShieldCheck size={16} />
                      Lock hook region
                    </button>
                    <button type="button" onClick={handleQueueReplaceSection}>
                      <WandSparkles size={16} />
                      Queue replace section
                    </button>
                    <button type="button" onClick={handleSaveSelectedToLocalLibrary}>
                      <Library size={16} />
                      Save selected to local library
                    </button>
                  </div>
                  {workflow.songLab.editActions.length > 0 && (
                    <div className="song-section-list" aria-label="Song Lab edit actions">
                      {workflow.songLab.editActions.map((action) => (
                        <div key={action.id}>
                          <strong>
                            {action.id} {action.status}
                          </strong>
                          <small>
                            {action.sectionId}: {action.label}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>Open Song Lab from the selected track to manage sections, locks, stems, and edits.</p>
                  <button type="button" disabled={!workflow.selectedTrack} onClick={handleOpenSongLab}>
                    <Waves size={16} />
                    Open Song Lab
                  </button>
                </>
              )}
            </div>
          )}
          {selected.kind === 'queue' && (
            <div className="workflow-section">
              <h3>Provider action results</h3>
              <p>Queue entries are persisted from provider action results, including blocked and unsupported actions.</p>
              <div className="job-list" aria-label="Provider job queue">
                {workflow.jobQueue.map((job) => (
                  <div key={job.id}>
                    <strong>
                      {job.capability} {job.status}
                    </strong>
                    <small>
                      {job.message}
                      {job.providerTaskId ? ` Task ${job.providerTaskId}.` : ''}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selected.kind === 'downloads' && (
            <div className="workflow-section">
              <h3>Provider export manager</h3>
              <p>Polls and callbacks turn provider task IDs into local download assets when outputs are ready.</p>
              <div className="gate-actions">
                <button type="button" disabled={!workflow.generationBatch} onClick={handlePollSelectedGenerationJob}>
                  <Activity size={16} />
                  Poll selected generation job
                </button>
                <button type="button" disabled={!workflow.generationBatch} onClick={handleReceiveFailedCallback}>
                  <GitBranch size={16} />
                  Receive failed callback
                </button>
                <button type="button" disabled={!workflow.musicVideoLane} onClick={handleRecordProviderVideoOutput}>
                  <Video size={16} />
                  Record provider video output
                </button>
              </div>
              <div className="export-list" aria-label="Provider export tasks">
                {workflow.exports.tasks.length === 0 ? (
                  <div>
                    <strong>No provider export tasks yet</strong>
                    <small>Poll a generation task or receive a callback to materialize outputs.</small>
                  </div>
                ) : (
                  workflow.exports.tasks.map((task) => (
                    <div className={task.status} key={task.id}>
                      <strong>
                        {task.capability} {task.status}
                      </strong>
                      <small>
                        {task.providerTaskId}; {task.message}
                      </small>
                    </div>
                  ))
                )}
              </div>
              {workflow.exports.downloads.length > 0 && (
                <div className="export-list" aria-label="Export downloads">
                  {workflow.exports.downloads.map((download) => (
                    <div className={download.status} key={download.id}>
                      <strong>
                        {download.kind} {download.status}
                      </strong>
                      <small>
                        {download.assetId}; {download.label}; {download.message}
                      </small>
                    </div>
                  ))}
                </div>
              )}
              {workflow.exports.callbacks.length > 0 && (
                <div className="export-list" aria-label="Provider callbacks">
                  {workflow.exports.callbacks.map((callback) => (
                    <div className={callback.status} key={callback.id}>
                      <strong>
                        {callback.callbackType} callback {callback.status}
                      </strong>
                      <small>
                        {callback.providerTaskId}; code {callback.code}; {callback.message}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selected.kind === 'library' && (
            <div className="workflow-section">
              <p>Provider library API unsupported. Local project saves remain available without pretending to sync upstream.</p>
              <button type="button" disabled={!workflow.selectedTrack} onClick={handleSaveSelectedToLocalLibrary}>
                <Library size={16} />
                Save selected to local library
              </button>
              <div className="library-list" aria-label="Local project library">
                {workflow.localLibrary.items.length === 0 ? (
                  <div>
                    <strong>No local saves yet</strong>
                    <small>Select a generated track to save it locally.</small>
                  </div>
                ) : (
                  workflow.localLibrary.items.map((item) => (
                    <div key={item.id}>
                      <strong>{item.track.id} saved locally</strong>
                      <small>
                        {item.track.title}
                        {item.ratingScore ? ` - taste score ${item.ratingScore}` : ''}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="action-box">
            <button
              type="button"
              aria-label="Open music video lane"
              disabled={!canOpenVideo}
              onClick={handleOpenVideoLane}
            >
              <Video size={16} />
              Open music video lane
            </button>
            {!workflow.selectedTrack && <p>Select a generated track before opening video.</p>}
            {workflow.musicVideoLane && <p>Music video lane is already open.</p>}
          </div>
          {selected.kind === 'video' && workflow.musicVideoLane && (
            <div className="lipsync-gate">
              <h3>Perfect lipsync gate</h3>
              <p>Music video source: {workflow.musicVideoLane.sourceTrackId}</p>
              <p>Source assets: {workflow.musicVideoLane.assetRefs.join(', ')}</p>
              <p
                aria-label="Video export gate state"
                className={`gate-state ${videoExportReady ? 'ready' : 'blocked'}`}
              >
                {videoExportReady ? 'Video export ready' : 'Video export blocked'}
              </p>
              <p>
                Video export stays blocked until phoneme, frame, mouth-shape, segment drift, and
                post-stitch checks all pass hard thresholds.
              </p>
              <div className="video-lane-section">
                <h3>Scene cards</h3>
                <div className="scene-list" aria-label="Music video scene cards">
                  {workflow.musicVideoLane.scenes.map((scene) => (
                    <div className={scene.status} key={scene.id}>
                      <strong>{scene.title}</strong>
                      <small>
                        {scene.startSeconds}s-{scene.endSeconds}s - {scene.mode} - {scene.status}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="video-lane-section">
                <h3>ComfyUI render graph</h3>
                {workflow.musicVideoLane.renderPlan ? (
                  <>
                    <p>
                      {workflow.musicVideoLane.renderPlan.model} seed {workflow.musicVideoLane.renderPlan.seed};{' '}
                      {workflow.musicVideoLane.renderPlan.status}
                    </p>
                    <div className="render-list" aria-label="ComfyUI render graph nodes">
                      {workflow.musicVideoLane.renderPlan.nodes.map((node) => (
                        <div key={node.id}>
                          <strong>{node.id}</strong>
                          <small>
                            {node.label}: {node.value}
                          </small>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>Render graph is planned from scenes, references, model, seed, and blocked worker output.</p>
                )}
                <div className="gate-actions">
                  <button type="button" disabled={Boolean(workflow.musicVideoLane.renderPlan)} onClick={handlePlanComfyRenderGraph}>
                    <GitBranch size={16} />
                    Plan ComfyUI render graph
                  </button>
                  <button
                    type="button"
                    disabled={!workflow.musicVideoLane.renderPlan || workflow.musicVideoLane.renderPlan.status === 'queued'}
                    onClick={handleQueueMusicVideoRender}
                  >
                    <Activity size={16} />
                    Queue music video render
                  </button>
                </div>
              </div>
              <div className="video-lane-section">
                <h3>Worker health</h3>
                <div className="worker-list" aria-label="Music video worker health">
                  {workflow.musicVideoLane.workerHealth.map((worker) => (
                    <div className={worker.status} key={worker.id}>
                      <strong>
                        {worker.label} {worker.status}
                      </strong>
                      <small>{worker.detail}</small>
                    </div>
                  ))}
                </div>
                {workflow.musicVideoLane.workerJobs.length > 0 && (
                  <div className="worker-list" aria-label="Music video worker jobs">
                    {workflow.musicVideoLane.workerJobs.map((job) => (
                      <div className={job.status} key={job.id}>
                        <strong>
                          {job.lane} {job.status}
                        </strong>
                        <small>{job.detail}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <ul className="lipsync-checklist" aria-label="Lipsync QA checks">
                {lipsyncCheckOrder.map((checkName) => {
                  const checkResult = activeLipsync?.[checkName]
                  const resultLabel = checkResult === undefined ? 'Pending' : checkResult ? 'Pass' : 'Repair required'
                  return (
                    <li
                      aria-label={`${lipsyncCheckLabels[checkName]} QA result`}
                      className={checkResult === undefined ? 'pending' : checkResult ? 'pass' : 'fail'}
                      key={checkName}
                    >
                      <span>{lipsyncCheckLabels[checkName]}</span>
                      <strong>{resultLabel}</strong>
                    </li>
                  )
                })}
              </ul>
              <div className="meter" aria-label="Lipsync readiness">
                <span style={{ width: `${lipsyncReadinessPercent}%` }} />
              </div>
              <div className="gate-actions">
                <button type="button" disabled={videoExportReady} onClick={handleRunLipsyncQa}>
                  <Gauge size={16} />
                  Run lipsync QA
                </button>
                <button
                  type="button"
                  disabled={failedVideoChecks.length === 0}
                  onClick={handleQueueLipsyncRepair}
                >
                  <WandSparkles size={16} />
                  Queue repair pass
                </button>
                <button type="button" onClick={handleCreateVideoReleasePack}>
                  <Download size={16} />
                  Create video release pack
                </button>
              </div>
              {videoExportError && (
                <p className="form-error" role="alert">
                  {videoExportError}
                </p>
              )}
              {workflow.musicVideoLane.failureRanges.length > 0 && (
                <div className="failure-list" aria-label="Exact lipsync failure ranges">
                  <h3>Exact failure ranges</h3>
                  {workflow.musicVideoLane.failureRanges.map((range) => (
                    <div key={range.id}>
                      <strong>{range.id}</strong>
                      <small>
                        {range.checkName} {range.startSeconds}s-{range.endSeconds}s - {range.severity};{' '}
                        {range.repairAction}
                      </small>
                    </div>
                  ))}
                </div>
              )}
              {workflow.musicVideoLane.repairAttempts.length > 0 && (
                <div className="repair-list" aria-label="Lipsync repair attempts">
                  <h4>Repair loop</h4>
                  {workflow.musicVideoLane.repairAttempts.map((attempt) => (
                    <div key={attempt.id}>
                      <strong>
                        {attempt.id} {attempt.status}
                      </strong>
                      <small>
                        {attempt.failedChecks.map((checkName) => lipsyncRepairLabels[checkName]).join(', ')}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selected.kind === 'export' && releasePack && (
            <div className="action-box">
              <strong>Release pack ready for {releasePack.trackId}</strong>
              <p>{releasePack.includesVideo ? 'Video included' : 'Audio only'}</p>
              <p>Provenance: {releasePack.provenance.join(', ')}</p>
              <div className="release-section">
                <h3>Package contents</h3>
                {releasePack.items.map((item) => (
                  <div key={item.id}>
                    <strong>{item.kind}</strong>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
              <div className="release-section">
                <h3>Provenance receipts</h3>
                {releasePack.receipts.map((receipt) => (
                  <div key={receipt.id}>
                    <strong>{receipt.action}</strong>
                    <small>{receipt.detail}</small>
                  </div>
                ))}
              </div>
              <div className="release-section">
                <h3>Archive-first cleanup</h3>
                <p>Cleanup {cleanupStatus}</p>
                <div className="gate-actions">
                  <button
                    type="button"
                    disabled={cleanupTargets.length === 0 || cleanupStatus === 'archived' || cleanupStatus === 'applied'}
                    onClick={handlePlanArchiveFirstCleanup}
                  >
                    <Archive size={16} />
                    Plan archive-first cleanup
                  </button>
                  <button type="button" disabled={cleanupStatus !== 'archived'} onClick={handleApplyCleanup}>
                    <Scissors size={16} />
                    Apply cleanup
                  </button>
                  <button type="button" disabled={cleanupStatus !== 'applied'} onClick={handleRestoreArchivedTracks}>
                    <Library size={16} />
                    Restore archived tracks
                  </button>
                </div>
                {workflow.archiveEntries.length > 0 && (
                  <div className="archive-list" aria-label="Archive entries">
                    {workflow.archiveEntries.map((entry) => (
                      <div key={entry.id}>
                        <strong>{entry.id}</strong>
                        <small>
                          {entry.track.id} - {entry.reason}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
                {workflow.cleanupReceipts.length > 0 && (
                  <div className="archive-list" aria-label="Cleanup receipts">
                    {workflow.cleanupReceipts.map((receipt) => (
                      <div key={receipt.id}>
                        <strong>{receipt.action}</strong>
                        <small>{receipt.targetTrackIds.join(', ')}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="api-box">
            <h3>API coverage</h3>
            <p>
              {apiCoverageEntries.length} mapped capabilities. {coverageCounts.implemented} implemented;
              {' '}
              {coverageCounts.planned} planned; {coverageCounts.unsupported} unsupported; server-only credentials enforced.
            </p>
            {apiActionResult && (
              <div className={`api-result ${apiActionResult.outcome}`} role="status">
                <strong>
                  {apiActionResult.capability}: {apiActionResult.outcome}
                </strong>
                <small>
                  {apiActionResult.message}
                  {apiActionResult.endpoint ? ` Endpoint ${apiActionResult.endpoint}.` : ''}
                  {apiActionResult.providerTaskId ? ` Task ${apiActionResult.providerTaskId}.` : ''}
                </small>
              </div>
            )}
            {apiCoverageEntries.map((entry) => (
              <div key={entry.capability}>
                <strong>{entry.capability}</strong>
                <small>
                  {entry.uiSurface} {'->'} {entry.backendOwner} {'->'} {entry.adapterAction} ({entry.status})
                </small>
                <button
                  aria-label={`Run API action ${entry.capability}`}
                  type="button"
                  onClick={() => void handleRunApiAction(entry)}
                >
                  <Activity size={14} />
                  {actionStateForEntry(entry).buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="bottom-deck">
        <div className="transport">
          <button aria-label="Play preview">
            <Play size={18} />
          </button>
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 52 }, (_, index) => (
              <span key={index} style={{ height: `${18 + ((index * 11) % 44)}px` }} />
            ))}
          </div>
          <button aria-label="Cut region">
            <Scissors size={18} />
          </button>
        </div>
        <div className="feature-grid">
          {featureList.map((feature) => (
            <div key={feature}>
              <Boxes size={15} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function buildWorkflowNodes(
  workflow: SunoWorkflow,
  releasePack: ReleasePack | null,
  recentProjects: ProjectSummary[],
  activeProjectId: string,
): WorkflowNode[] {
  const activeProject = recentProjects.find((project) => project.projectId === activeProjectId)
  const nodes: WorkflowNode[] = [
    {
      id: 'project-lobby',
      kind: 'project',
      title: 'Project lobby',
      summary: `${recentProjects.length} saved project${recentProjects.length === 1 ? '' : 's'}; current ${activeProjectId}`,
      status: 'ready',
      x: 4,
      y: 6,
      meta: [
        activeProjectId,
        activeProject?.selectedTrackId ? `selected ${activeProject.selectedTrackId}` : 'no selected track',
        activeProject ? `${activeProject.jobCount} jobs` : 'not saved yet',
        activeProject ? `${activeProject.exportCount} exports` : 'no exports',
      ],
    },
    {
      id: 'brief',
      kind: 'brief',
      title: 'Idea brief',
      summary: workflow.brief,
      status: 'locked',
      x: 8,
      y: 18,
      meta: ['editable brief', 'constraints', 'target mood'],
    },
    {
      id: 'lyrics',
      kind: 'lyrics',
      title: 'Lyrics sheet',
      summary: workflow.lyrics,
      status: 'needs-review',
      x: 28,
      y: 9,
      meta: ['editable lyrics', 'section labels', 'phoneme export'],
    },
    {
      id: 'style',
      kind: 'style',
      title: 'Style stack',
      summary: workflow.style,
      status: 'draft',
      x: 29,
      y: 37,
      meta: ['style prompt', 'negative tags', 'reference taste'],
    },
    {
      id: 'voice',
      kind: 'voice',
      title: 'Voice / persona',
      summary: workflow.voice,
      status: 'draft',
      x: 50,
      y: 17,
      meta: ['persona', 'voice', 'consent'],
    },
    {
      id: 'project-assets',
      kind: 'assets',
      title: 'Source assets',
      summary: `${workflow.projectAssets.items.length} assets and ${workflow.projectAssets.imports.length} import receipts`,
      status: workflow.projectAssets.imports.some((job) => job.status === 'blocked') ? 'needs-review' : 'ready',
      x: 48,
      y: 31,
      meta: [
        'uploads',
        'cover art',
        workflow.voicePersonas.activePersonaId ? `persona ${workflow.voicePersonas.activePersonaId}` : 'persona',
      ],
    },
    {
      id: 'local-library',
      kind: 'library',
      title: 'Local library',
      summary: `${workflow.localLibrary.items.length} local saves; provider library API ${workflow.localLibrary.providerLibraryStatus}`,
      status: workflow.localLibrary.items.length > 0 ? 'ready' : 'draft',
      x: 12,
      y: 62,
      meta: ['local project state', `provider library ${workflow.localLibrary.providerLibraryStatus}`, 'taste memory'],
    },
    {
      id: 'downloads',
      kind: 'downloads',
      title: 'Downloads / exports',
      summary: `${workflow.exports.tasks.length} provider tasks and ${workflow.exports.downloads.length} download assets`,
      status: workflow.exports.tasks.some((task) => task.status === 'failed' || task.status === 'blocked')
        ? 'needs-review'
        : workflow.exports.downloads.some((download) => download.status === 'ready')
          ? 'ready'
          : 'draft',
      x: 30,
      y: 62,
      meta: [
        'polls',
        'callbacks',
        `${workflow.exports.callbacks.length} callback receipts`,
      ],
    },
  ]

  if (workflow.generationBatch) {
    nodes.push({
      id: 'batch',
      kind: 'batch',
      title: 'Generation batch',
      summary: `${workflow.generationBatch.tracks.length} Suno variants from ${workflow.generationBatch.providerJobId}`,
      status: workflow.selectedTrack ? 'locked' : 'needs-review',
      x: 49,
      y: 45,
      meta: ['provider create', 'version candidates', workflow.generationBatch.providerJobId],
    })

    nodes.push({
      id: 'version-comparison',
      kind: 'compare',
      title: 'Version comparison',
      summary: `${Object.keys(workflow.taste.ratings).length} ratings and ${workflow.taste.comparisons.length} comparison receipts`,
      status: workflow.taste.comparisons.length > 0 ? 'ready' : 'needs-review',
      x: 39,
      y: 68,
      meta: ['A/B compare', 'taste score', 'version lineage'],
    })

    workflow.generationBatch.tracks.forEach((track, index) => {
      nodes.push(toGeneratedTrackNode(track, index, workflow.selectedTrack?.id === track.id))
    })
  }

  if (workflow.selectedTrack) {
    nodes.push(
      {
        id: 'track',
        kind: 'track',
        title: 'Chosen track',
        summary: `${workflow.selectedTrack.title} selected as audio source of truth (${workflow.selectedTrack.id})`,
        status: 'locked',
        x: 70,
        y: 24,
        meta: ['audio source of truth', workflow.selectedTrack.id, 'version lineage'],
      },
      {
        id: 'song-lab',
        kind: 'songlab',
        title: 'Song Lab',
        summary: workflow.songLab
          ? `${workflow.songLab.sections.length} sections, ${workflow.songLab.stems.length} stems, ${workflow.songLab.editActions.length} edit actions`
          : 'Timeline, sections, stems, region locks, and edit actions derive from the selected track.',
        status: workflow.songLab ? 'ready' : 'draft',
        x: 69,
        y: 53,
        meta: ['sections', 'stems', 'replace section', 'arrangement locks'],
      },
      {
        id: 'video',
        kind: 'video',
        title: 'Music video lane',
        summary: workflow.musicVideoLane
          ? `Storyboard and lipsync QA opened from ${workflow.musicVideoLane.sourceTrackId}; video export ${workflow.musicVideoLane.exportStatus}`
          : 'Storyboard and ComfyUI render plan opens only from the selected song.',
        status: workflow.musicVideoLane?.exportStatus === 'ready' ? 'ready' : workflow.musicVideoLane ? 'needs-review' : 'draft',
        x: 88,
        y: 35,
        meta: [
          'perfect lipsync gate',
          'scene cards',
          'audio preserved',
          workflow.musicVideoLane?.exportStatus === 'ready' ? 'video export ready' : 'video export blocked',
        ],
      },
    )
  }

  if (workflow.jobQueue.length > 0) {
    nodes.push({
      id: 'job-queue',
      kind: 'queue',
      title: 'Job queue',
      summary: `${workflow.jobQueue.length} provider action result${workflow.jobQueue.length === 1 ? '' : 's'} captured`,
      status: workflow.jobQueue.some((job) => job.status === 'blocked' || job.status === 'unsupported')
        ? 'needs-review'
        : 'ready',
      x: releasePack ? 74 : 88,
      y: releasePack ? 70 : 68,
      meta: workflow.jobQueue.slice(-3).map((job) => `${job.capability} ${job.status}`),
    })
  }

  if (releasePack) {
    nodes.push({
      id: 'export',
      kind: 'export',
      title: 'Release pack',
      summary: `${releasePack.includesVideo ? 'Audio, video' : 'Audio'}, metadata, prompts, and provenance bundle for ${releasePack.trackId}.`,
      status: 'exported',
      x: 88,
      y: 68,
      meta: ['download', 'share', 'archive', 'provenance'],
    })
  }

  return nodes
}

function toGeneratedTrackNode(track: GeneratedTrack, index: number, isSelected: boolean): WorkflowNode {
  return {
    id: `generated-${track.id}`,
    kind: 'generated',
    title: track.title,
    summary: `Generated track ${track.id}, ${track.durationSeconds}s`,
    status: isSelected ? 'locked' : 'needs-review',
    x: 58 + index * 9,
    y: 58 + index * 3,
    meta: ['candidate take', track.id, `${track.durationSeconds}s`],
    trackId: track.id,
  }
}

function discardedGeneratedTracks(workflow: SunoWorkflow): GeneratedTrack[] {
  if (!workflow.generationBatch || !workflow.selectedTrack) {
    return []
  }

  return workflow.generationBatch.tracks.filter((track) => track.id !== workflow.selectedTrack?.id)
}
