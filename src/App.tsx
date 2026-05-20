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
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'

type NodeStatus = 'draft' | 'generating' | 'needs-review' | 'locked' | 'exported'
type NodeKind =
  | 'brief'
  | 'lyrics'
  | 'style'
  | 'voice'
  | 'batch'
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
}

const statusLabel: Record<NodeStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  'needs-review': 'Needs review',
  locked: 'Locked',
  exported: 'Exported',
}

const iconByKind: Record<NodeKind, ComponentType<{ size?: number }>> = {
  brief: FileText,
  lyrics: Mic2,
  style: SlidersHorizontal,
  voice: Bot,
  batch: Sparkles,
  track: FileAudio,
  stem: Waves,
  video: Video,
  export: Download,
}

const workflowNodes: WorkflowNode[] = [
  {
    id: 'brief',
    kind: 'brief',
    title: 'Idea brief',
    summary: 'Arabic club-pop hook, bilingual chorus, dark cinematic lift.',
    status: 'locked',
    x: 8,
    y: 18,
    meta: ['reference board', 'constraints', 'target mood'],
  },
  {
    id: 'lyrics',
    kind: 'lyrics',
    title: 'Lyrics sheet',
    summary: 'Verse, pre, chorus, bridge with syllable density markers.',
    status: 'needs-review',
    x: 28,
    y: 9,
    meta: ['section labels', 'rhyme map', 'phoneme export'],
  },
  {
    id: 'style',
    kind: 'style',
    title: 'Style stack',
    summary: 'Gulf percussion, polished electro-pop, restrained vocal glaze.',
    status: 'draft',
    x: 29,
    y: 37,
    meta: ['tags', 'negative tags', 'reference taste'],
  },
  {
    id: 'voice',
    kind: 'voice',
    title: 'Voice / persona',
    summary: 'Reusable vocal identity with prompt-safe consent notes.',
    status: 'draft',
    x: 50,
    y: 17,
    meta: ['persona', 'voice', 'consent'],
  },
  {
    id: 'batch',
    kind: 'batch',
    title: 'Generation batch',
    summary: 'Six Suno variants with cost, queue, seed and model state.',
    status: 'generating',
    x: 49,
    y: 45,
    meta: ['create', 'extend', 'cover', 'remaster'],
  },
  {
    id: 'track',
    kind: 'track',
    title: 'Chosen track',
    summary: 'Approved song with version lineage and region locks.',
    status: 'locked',
    x: 70,
    y: 24,
    meta: ['audio source of truth', 'timeline', 'download'],
  },
  {
    id: 'stem',
    kind: 'stem',
    title: 'Stems / edit regions',
    summary: 'Vocals, drums, bass, music stem cards plus replacement zones.',
    status: 'needs-review',
    x: 69,
    y: 53,
    meta: ['stems', 'replace section', 'arrangement'],
  },
  {
    id: 'video',
    kind: 'video',
    title: 'Music video lane',
    summary: 'Storyboard and ComfyUI render plan as a subfeature of the song.',
    status: 'draft',
    x: 88,
    y: 35,
    meta: ['perfect lipsync gate', 'scene cards', 'audio preserved'],
  },
  {
    id: 'export',
    kind: 'export',
    title: 'Release pack',
    summary: 'Audio, video, credits, prompts, metadata and audit bundle.',
    status: 'exported',
    x: 88,
    y: 68,
    meta: ['download', 'share', 'archive', 'provenance'],
  },
]

const apiCoverage = [
  ['Generate', 'Create, custom mode, lyrics, instrumental, model choice'],
  ['Edit', 'Extend, cover, remix, remaster, replace section, stems'],
  ['Identity', 'Voices, personas, uploads, reusable style memory'],
  ['Library', 'Songs, versions, likes, archive, trash, destructive cleanup'],
  ['Operations', 'Queue status, credits, costs, retries, webhooks, downloads'],
  ['Safety', 'Consent, provenance, moderation, generated labels, audit log'],
]

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

export function App() {
  const [selectedId, setSelectedId] = useState('track')
  const selected = useMemo(
    () => workflowNodes.find((node) => node.id === selectedId) ?? workflowNodes[0],
    [selectedId],
  )
  const SelectedIcon = iconByKind[selected.kind]

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Suno Visual Studio</p>
          <h1>Visual music generation operating app</h1>
        </div>
        <div className="topbar-actions" aria-label="Project controls">
          <button aria-label="Run generation">
            <Play size={16} />
            Run
          </button>
          <button aria-label="Open API coverage">
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
                Queue live
              </span>
              <span>
                <Gauge size={14} />
                Cost guard on
              </span>
              <span>
                <GitBranch size={14} />
                Versions tracked
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
                  onClick={() => setSelectedId(node.id)}
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
          <div className="lipsync-gate">
            <h3>Perfect lipsync gate</h3>
            <p>Video export stays blocked until phoneme, frame and mouth-shape drift all pass hard thresholds.</p>
            <div className="meter" aria-label="Lipsync readiness">
              <span />
            </div>
          </div>
          <div className="api-box">
            <h3>API coverage</h3>
            {apiCoverage.map(([label, detail]) => (
              <div key={label}>
                <strong>{label}</strong>
                <small>{detail}</small>
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
