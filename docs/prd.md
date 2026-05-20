# Suno Visual Studio PRD

## Product

Suno Visual Studio is a dynamic visual app for the whole Suno music generation workflow. It should feel closer to Google Stitch or Claude Design than a CLI: a live canvas where briefs, lyrics, style stacks, voices, generations, stems, versions, video scenes, exports, and review gates are visible objects.

The music video flow is a subfeature of the overall Suno music generation tool. It starts only after a song or version is selected as the audio source of truth.

## Non-Negotiables

- Visual-first app. CLI, Printing Press, Suno API wrappers, ComfyUI and job workers are engines behind the interface.
- Full Suno API coverage. Every available endpoint or capability must be mapped to a UI feature, a background capability, or an explicit unsupported-state record.
- Perfect lipsync is a hard gate for music-video export. Approximate sync is a failed state with repair actions.
- Destructive cleanup is allowed only with archive-first behavior, undo, receipts, and audit logs.
- API keys and provider credentials are server-side only. They must never be exposed to client bundles.
- Music video is subordinate to song creation, comparison, editing, release, and library management.

## Users

- Issa as creative director/operator: wants rapid iteration, visual control, taste memory, evidence, and high-output workflows without losing the shape of the product.
- Power creator: wants Suno generation, version comparison, stems, video, and release assets in one place.
- Agent operator: wants inspectable automated lanes for lyrics, arrangement, visuals, metadata, cleanup, and review.

## Core Workflow

1. Create project from a brief, reference, or imported audio.
2. Build prompt, lyrics, style, voice/persona, negative constraints, and target output cards.
3. Generate Suno batches with visible queue, cost, model, status, seed, and retry state.
4. Compare variants with playback, ratings, notes, taste scoring, and version lineage.
5. Lock a chosen song or branch into Song Lab.
6. Edit regions, sections, extensions, covers, remasters, replacements, stems, and arrangement states.
7. Optionally open Music Video Lane for storyboard, ComfyUI plan, assets, lipsync, render, stitch, QA, and export.
8. Produce release pack: audio, video, cover art, lyrics, captions, prompt history, metadata, credits, provenance, and cleanup receipts.

## Main Surfaces

- Project Lobby: recent projects, status, queue health, credits, drafts, blocked exports.
- Creation Canvas: node graph for brief, lyrics, style, voice, batch, track, stems, video, export.
- Song Lab: timeline, playback, sections, stems, region locks, remix/cover/extend/remaster tools.
- Library: songs, versions, liked items, archived items, playlists, personas, voices, uploads.
- Taste System: ratings, tags, winners, rejected patterns, reusable style recipes, prompt deltas.
- API Coverage Console: endpoint parity, unsupported states, status, auth, rate limits, errors.
- Music Video Lane: storyboard, scene cards, ComfyUI render graph, asset routing, lipsync QA, export.
- Release Pack: final assets, metadata, provenance, audit trail, download/share package.
- Settings: API keys, model defaults, cost caps, storage, webhooks, worker health.

## API Coverage Requirements

The app must represent all available Suno-side capabilities in one of these states: implemented, planned, blocked, unsupported by current provider, or deprecated.

Coverage categories:

- Generation: create song, custom mode, instrumental, lyrics generation, model/version selection.
- Continuation/editing: extend, cover, remix, remaster, replace section, region editing.
- Source material: audio upload, reference audio, voice/persona selection, reusable style or identity.
- Stems and assets: vocal stem, instrumental stem, metadata, lyrics, cover art, waveform.
- Library: list, search, retrieve, like/unlike, archive, trash/delete, restore, visibility.
- Operations: task status, queue, credits, cost estimate, retries, backoff, webhooks.
- Export: download audio, stems, lyrics, captions, video, release pack, provenance bundle.

## Music Video Lane

The MV lane is opened from a selected song/version. It must preserve the original audio unless the user explicitly branches or replaces it.

Required subfeatures:

- Song section map from lyrics, beats, choruses, bridges, drops, and instrumental regions.
- Scene cards tied to exact audio ranges.
- ComfyUI workflow planning with models, prompts, seeds, references, assets, and render queue.
- Performance/avatar mode, narrative montage mode, abstract audio-reactive mode, and lyric/caption mode.
- Lipsync track from vocals and phoneme timing.
- Drift detection at phoneme, mouth-shape, frame, and segment levels.
- Repair loop for failed sync: regenerate mouth, retime, split scene, rerender, or block export.
- Stitching and QA for full-song video.
- Final export with audio unchanged unless explicitly branched.

## Perfect Lipsync Definition

"Perfect" means the export gate only passes when automated checks and visual QA agree that lip, phoneme, and frame alignment are within hard thresholds for every singing section. The app must not label a render perfect from a generic confidence score.

Required checks:

- Per-phoneme timing alignment.
- Per-frame mouth-shape classification against expected phoneme.
- Segment drift detection and cumulative drift cap.
- Recheck after stitching, encoding, and caption burn-in.
- Human-visible failure report with exact bad ranges.

## Destructive Cleanup

Destructive cleanup includes delete, trash, archive, unlike, unpublish, hide, remove from project, remove generated files, clear failed jobs, and purge temporary renders.

Rules:

- Default action is archive, not permanent delete.
- Every destructive action needs a receipt with target, source, time, actor, reversible state, and reason.
- Permanent deletion requires a separate explicit command surface.
- Cleanup suggestions are allowed, but execution must remain undoable wherever possible.

## MVP

The first usable slice is:

- React visual app shell with left command rail, center graph canvas, right inspector, and bottom audio/timeline deck.
- Static but truthful node model for brief, lyrics, style, voice, batch, track, stems, MV lane, release.
- PRD, API coverage doc, Greptile config, and GoalBuddy board.
- Tests proving the MV lane remains subordinate and the full-shape anchors remain visible.
- Build, lint, typecheck, unit test, browser smoke, and Greptile PR review.

## Acceptance Criteria

- A new developer can read the repo docs and understand that this is a visual Suno workflow app, not a CLI and not a ComfyUI-only MV tool.
- The app UI shows the full workflow shape on first load.
- The Music Video Lane is visible as a subfeature.
- Perfect lipsync is represented as a blocking QA gate.
- Full API coverage has a dedicated doc and review rule.
- Destructive cleanup is archive-first and audited.
- Greptile has repo config and review rules.
- GoalBuddy state records the product shape and delivery tasks.
- Verification suite passes: lint, typecheck, unit tests, build, e2e smoke.

## Source Pointers

- Suno Help: https://help.suno.com/
- Google Stitch announcement: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/
- Claude Design-style target: visual generation, iteration, and editable design surfaces.
