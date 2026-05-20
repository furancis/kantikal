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
import { useMemo, useState } from 'react'
import { actionStateForEntry } from './api/actionCatalog'
import type { ApiCoverageEntry } from './api/coverage'
import { apiCoverageEntries, apiCoverageStatusCounts } from './api/coverage'
import { createMockSunoProvider, executeProviderAction } from './api/provider'
import type { ProviderActionResult, SunoProvider } from './api/provider'
import {
  applyArchiveFirstCleanup,
  createWorkflow,
  evaluateLipsync,
  failedLipsyncChecks,
  openMusicVideoLane,
  planArchiveFirstCleanup,
  queueLipsyncRepair,
  restoreArchivedTracks,
  selectTrack,
  submitGenerationBatch,
  toReleasePack,
  type BriefInput,
  type GeneratedTrack,
  type LipsyncCheckName,
  type LipsyncChecks,
  type ReleasePack,
  type SunoWorkflow,
} from './domain/workflow'

type NodeStatus = 'draft' | 'generating' | 'needs-review' | 'locked' | 'exported' | 'ready'
type NodeKind =
  | 'brief'
  | 'lyrics'
  | 'style'
  | 'voice'
  | 'batch'
  | 'generated'
  | 'track'
  | 'stem'
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
  brief: FileText,
  lyrics: Mic2,
  style: SlidersHorizontal,
  voice: Bot,
  batch: Sparkles,
  generated: FileAudio,
  track: FileAudio,
  stem: Waves,
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
}

export function App({ provider: injectedProvider }: AppProps = {}) {
  const mockProvider = useMemo(() => createMockSunoProvider(), [])
  const provider = injectedProvider ?? mockProvider
  const coverageCounts = useMemo(() => apiCoverageStatusCounts(apiCoverageEntries), [])
  const [briefInput, setBriefInput] = useState<BriefInput>(initialBrief)
  const [workflow, setWorkflow] = useState<SunoWorkflow>(() => createWorkflow(initialBrief))
  const [releasePack, setReleasePack] = useState<ReleasePack | null>(null)
  const [selectedId, setSelectedId] = useState('brief')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [videoExportError, setVideoExportError] = useState<string | null>(null)
  const [apiActionResult, setApiActionResult] = useState<ProviderActionResult | null>(null)

  const workflowNodes = useMemo(
    () => buildWorkflowNodes(workflow, releasePack),
    [workflow, releasePack],
  )
  const selected = workflowNodes.find((node) => node.id === selectedId) ?? workflowNodes[0]
  const SelectedIcon = iconByKind[selected.kind]
  const canOpenVideo = Boolean(workflow.selectedTrack) && !workflow.musicVideoLane
  const activeLipsync = workflow.musicVideoLane?.lipsync ?? null
  const failedVideoChecks = activeLipsync ? failedLipsyncChecks(activeLipsync) : []
  const lipsyncReadyCount = activeLipsync ? lipsyncCheckOrder.length - failedVideoChecks.length : 0
  const lipsyncReadinessPercent = Math.round((lipsyncReadyCount / lipsyncCheckOrder.length) * 100)
  const videoExportReady = workflow.musicVideoLane?.exportStatus === 'ready'
  const cleanupTargets = discardedGeneratedTracks(workflow)
  const cleanupStatus = workflow.cleanupPlan?.status ?? 'idle'

  async function handleGenerate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setIsGenerating(true)
    setGenerateError(null)
    setVideoExportError(null)
    try {
      const baseWorkflow = createWorkflow(briefInput)
      const generationBatch = await provider.generateBatch({
        ...briefInput,
        count: 2,
      })
      setReleasePack(null)
      setWorkflow(submitGenerationBatch(baseWorkflow, generationBatch))
      setSelectedId('batch')
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRunApiAction(entry: ApiCoverageEntry) {
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
    setApiActionResult(result)
  }

  function handleFieldChange(field: keyof BriefInput) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  function handleOpenVideoLane() {
    setWorkflow((current) => openMusicVideoLane(current))
    setVideoExportError(null)
    setSelectedId('video')
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
        </div>
        <div className="topbar-actions" aria-label="Project controls">
          <button aria-label="Run generation" disabled={isGenerating} onClick={() => void handleGenerate()}>
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

      <section className="workspace" aria-label="Suno workflow workspace">
        <aside className="prompt-rail">
          <div className="rail-block active">
            <WandSparkles size={18} />
            <span>Prompt board</span>
          </div>
          <form className="prompt-form" onSubmit={(event) => void handleGenerate(event)}>
            <label>
              <span>Brief</span>
              <textarea value={briefInput.brief} onChange={handleFieldChange('brief')} disabled={isGenerating} />
            </label>
            <label>
              <span>Lyrics</span>
              <textarea value={briefInput.lyrics} onChange={handleFieldChange('lyrics')} disabled={isGenerating} />
            </label>
            <label>
              <span>Style</span>
              <input value={briefInput.style} onChange={handleFieldChange('style')} disabled={isGenerating} />
            </label>
            <label>
              <span>Voice</span>
              <input value={briefInput.voice} onChange={handleFieldChange('voice')} disabled={isGenerating} />
            </label>
            <button type="submit" aria-label="Generate mock Suno batch" disabled={isGenerating}>
              <Sparkles size={16} />
              {isGenerating ? 'Generating' : 'Generate mock Suno batch'}
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
          {selected.kind === 'track' && workflow.selectedTrack && (
            <div className="action-box">
              <p>Selected source: {workflow.selectedTrack.id}</p>
              <button type="button" onClick={handleCreateReleasePack}>
                <Download size={16} />
                Create audio release pack
              </button>
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

function buildWorkflowNodes(workflow: SunoWorkflow, releasePack: ReleasePack | null): WorkflowNode[] {
  const nodes: WorkflowNode[] = [
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
  ]

  if (workflow.generationBatch) {
    nodes.push({
      id: 'batch',
      kind: 'batch',
      title: 'Generation batch',
      summary: `${workflow.generationBatch.tracks.length} mock Suno variants from ${workflow.generationBatch.providerJobId}`,
      status: workflow.selectedTrack ? 'locked' : 'needs-review',
      x: 49,
      y: 45,
      meta: ['mock create', 'version candidates', workflow.generationBatch.providerJobId],
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
        id: 'stem',
        kind: 'stem',
        title: 'Stems / edit regions',
        summary: 'Stem and region cards are ready to derive from the selected track.',
        status: 'draft',
        x: 69,
        y: 53,
        meta: ['stems', 'replace section', 'arrangement'],
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
