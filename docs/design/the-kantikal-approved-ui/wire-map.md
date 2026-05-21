# Wire Map · The Kantikal

Exact file → file mapping from this design output to the React/TypeScript
repo (`suno-visual-studio`). For each asset: source in this design folder,
destination in the repo, and notes about porting decisions.

The design output is React JSX + babel inline. The repo is React 19 + Vite +
TypeScript. Port to `.tsx`, add prop types, keep behavior identical.

## Tokens & styles

| Design source | Repo destination | Notes |
|---|---|---|
| `tokens.css` | replaces token block in `src/styles.css` | Includes `:root, [data-theme="crypt"]`, `[data-theme="vellum"]`, `[data-theme="faery"]`, `[data-theme="bone"]`. Set `<html data-theme="faery">` as default (locked direction). |
| `kantikal.css` | replaces or imports into `src/styles.css` | All `.kk-*` classes. Border/radii/lyric-weight use CSS vars so themes can override. |

## Shell

| Design source | Repo destination | Notes |
|---|---|---|
| `lib/chrome.jsx` → `TopBar` | `src/shell/TopBar.tsx` | Uppercase nav, centered. Proof toggle posts `proof:on/off` to a Zustand store consumed by FitRow, Diff, DNA cards. |
| `lib/chrome.jsx` → `LeftRail` | `src/shell/LeftRail.tsx` | Section list driven by `useProject()` selector. Selected ref/voice → store. |
| `lib/chrome.jsx` → `RightInspector` | `src/shell/RightInspector.tsx` | Slot-based: each screen passes `blocks={[...]}`. Default blocks live in `RightInspector.defaultBlocks.tsx`. |
| `lib/chrome.jsx` → `Workbench, Take, Fit, WaveSVG` | `src/shell/Workbench.tsx`, `GeneratedTakeTray.tsx`, `Take.tsx`, `Fit.tsx`, `WaveSVG.tsx` | WaveSVG is visual-only; real wave from `domain/audioAnalysis.ts` (when computed). |

## Lyric document

| Design source | Repo destination | Notes |
|---|---|---|
| `lib/lyric.jsx` → `LyricDocument` | `src/lyric/LyricDocument.tsx` | Renders from `LyricDoc` repository. Per-line `data-line-id` for selection. Selection → store → cascades to inspector + workbench filter. |
| `lib/lyric.jsx` → `ALMOST_LOVE` | `dev/fixtures/lyric.almost-love.json` | Use only as a dev fixture and onboarding template. |

## Background fabric

| Design source | Repo destination | Notes |
|---|---|---|
| `lib/fabric.jsx` → `LyricFabric` | `src/shell/LyricFabric.tsx` | Mount as first child of `KantikalShell`. Read `--kk-ink` via `getComputedStyle` of parent; observe `MutationObserver` on `[data-theme]` to re-read on theme change. Pause on `document.hidden` and `IntersectionObserver` offscreen. Honour `prefers-reduced-motion`. |

## Liquid DOM

`@liquid-dom/react` is already in `package.json`. The production target is
**pattern 2** (one root scene refracting the fabric).

```
<GlassContainer>                                ← src/shell/KantikalShell.tsx wraps everything in this
  <Background>
    <LyricFabric />                              ← the breathing letters
    <BaseColor />                                ← solid var(--kk-base)
  </Background>

  {/* DOM tree paints inside the container; Glass elements
     positioned over panels actually refract the fabric */}
  <TopBar />
  <Glass.Bar  bounds={topBar.bounds}  refraction={0.06} thickness={1.4} />
  <LeftRail />
  <Glass.Bar  bounds={rail.bounds}    refraction={0.10} thickness={2}   />
  <LyricCenter />                                ← intentionally NO glass — readable text needs no warp
  <RightInspector />
  <Glass.Bar  bounds={inspector.bounds} refraction={0.10} thickness={2} />
  <Workbench />
  <Glass.Bar  bounds={workbench.bounds} refraction={0.08} thickness={1.6} />
</GlassContainer>
```

Per-surface command glass (chips, picker tiles, generation diff slab, lineage
overlay, taste signal popover) uses `<LiquidSurface real>` from
`lib/liquid.jsx` → `src/material/LiquidSurface.tsx`. That mounts its own
local Glass when WebGPU is present; CSS fallback (the `.kk-liquid` class)
otherwise.

**WebGPU gate.** Probe `navigator.gpu.requestAdapter()` at boot. If absent:
set `<html data-liquid="css">`, all `.kk-liquid` surfaces fall back to
`backdrop-filter`. Log once to telemetry.

**Chrome HTML-in-Canvas flag.** Only required if we render DOM content
INSIDE a Glass via `<Html>`. We don't — DOM stays on top, only the Background
is refracted. So the experimental flag is NOT a hard requirement; it just
unlocks the more elaborate Liquid DOM showcase tricks if we ever want them.

## Screens

| Design source | Repo destination | Domain wiring |
|---|---|---|
| `screens/Console.jsx` | `src/screens/LyricConsole.tsx` | `useLyric()`, `useTakes(scope)`, `useTasteSignals(scope)`, `useSoundDna(scope)`. |
| `screens/Compare.jsx` | `src/screens/TasteCompare.tsx` | `useCompareGrid(takeIds, axes)`. Cells dispatch `applyTasteSignal()`. |
| `screens/Picker.jsx` | `src/screens/RemixPicker.tsx` | `useRemixDraft()`. Each column is a `LineageRule` source slot. Send dispatches `composeGenerationBrief()`. |
| `screens/DNA.jsx` | `src/screens/SoundDnaLibrary.tsx` | `useSoundDna()` returns `{traits, antiSignals, evidenceMix}`. Evidence mix surfaces unverified loudly. |
| `screens/Desk.jsx` | `src/screens/GenerationDesk.tsx` | `useDraftBrief()`, `useReceiptLog()`. Submit calls `runs.submit()` → opens a receipt. |
| `screens/Genealogy.jsx` | `src/screens/TrackGenealogy.tsx` | `useLineage()` returns lanes + edges. Node click → selection. Edge labels are deterministic mutation summaries. |
| `screens/SongLab.jsx` | `src/screens/SongLab.tsx` | `useLabQueue()`. Each `OpCard` dispatches `queueLabOp()`. |
| `screens/Release.jsx` | `src/screens/ReleasePack.tsx` | `useReleaseGates()`. Export dispatches `release.bundle()` which produces a sealed pack with receipts. |

## State / store

| concept | repo location | invariants |
|---|---|---|
| Active selection | `src/store/selection.ts` | Single source for "what's selected" — line, section, take, branch. |
| TasteSignal store | `src/store/tasteSignals.ts` | Append-only. Index by `targetType + targetId`. |
| SoundDna | `src/store/soundDna.ts` | Derived from TasteSignals via reducers + manual edits in the library. |
| Genealogy | `src/store/lineage.ts` | Branches are nodes + edges. Edges carry mutation summaries. |
| Receipts | `src/store/receipts.ts` | Append-only. Every provider action records a receipt. |
| Provider status | `src/api/provider.ts` | `state: ok | warn | down`, `label`, last error. |

## Persistence (DB-first)

| object | table | notes |
|---|---|---|
| Project | `projects` | name, key, bpm, version |
| LyricDocument | `lyric_docs` | per project, one canonical doc + revision history |
| LyricLine | `lyric_lines` | line_no, text, section, role, intent, lang, keep/mutate/avoid |
| Reference | `references` | type (audio/text/voice), source, duration |
| SoundTrait | `sound_traits` | trait, kind (vocal/rhythm/mix/...), evidence, sources[] |
| AntiSignal | `anti_signals` | same shape as SoundTrait but inverted |
| GeneratedTake | `takes` | id, branch_id, source_run_id, prompt, seed, model, audio_url, archived_at, archive_reason |
| TasteSignal | `taste_signals` | target_type, target_id, sentiment, trait, reason, scope, evidence |
| LineageRule | `lineage_rules` | branch_id, verb (preserve/mutate/avoid/add), what, src |
| Branch | `branches` | id, parent_id, name, created_at, archived_at, archive_reason |
| GenerationReceipt | `gen_receipts` | id, branch_id, brief_json, status, cost, provider_id, at |
| ReleasePack | `release_packs` | id, take_id, gates_json, exported_at |

JSON only at the boundaries: import/export, backups, receipts (mirrored from
DB), debugging snapshots.

## Provider boundaries

`src/api/provider.ts` adapter has `submit(brief)`, `poll(receiptId)`,
`fetchTake(id)`. Browser-automation mode auth lives behind a sandboxed
WebView; receipts capture every action.

## Asset registry

Reference audio, voice models, and any uploaded MV assets carry provenance
labels (manual upload / referenced URL / generated). Stored in `assets`
table with mime, sha, and source.

## Telemetry events (suggested)

- `selection.changed(scope)` — only when target changes, not on hover
- `tasteSignal.applied(signal)` — never includes the lyric text content, only ids
- `generation.submitted(receiptId)` — and `.acked`, `.received`, `.closed`
- `branch.created(parent → child, verbs)`
- `branch.archived(branch, reason)`
- `release.exported(packId)`

No content telemetry (no lyric text). IDs and shapes only.

## Mapping back to the implementation contract

The contract listed required folder output:

| Contract file | Where it is in this design output | Repo destination |
|---|---|---|
| `design-manifest.json` | this folder | repo `/design/` |
| `tokens.css` | `tokens.css` | replaces token block in `src/styles.css` |
| `app.html` | `index.html` (canvas entry) | not directly ported — see `app.tsx` |
| `app.tsx` | implied by `canvas.jsx` + `screens/*` | `src/App.tsx` consuming `KantikalShell` + router |
| `components/*.tsx` | `lib/*` + `screens/*` + `labs/*` | `src/shell/*`, `src/screens/*`, `src/material/*`, `src/lyric/*` |
| `motion-spec.json` | this folder | `src/motion/spec.json` consumed by framer-motion / Theatre |
| `state-matrix.md` | this folder | `docs/state-matrix.md` |
| `wire-map.md` | this file | `docs/wire-map.md` |
| `asset-notes.md` | this folder | `docs/asset-notes.md` |

