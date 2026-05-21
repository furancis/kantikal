# The Kantikal Claude Design Implementation Contract

Claude Design must output wireable app deliverables, not screenshots only.

## Required Folder Output

- `design-manifest.json`
- `tokens.css`
- `app.html`
- `app.tsx`
- `components/*.tsx`
- `motion-spec.json`
- `state-matrix.md`
- `wire-map.md`
- `asset-notes.md`

## Required Components

- `KantikalShell`
- `LyricDocument`
- `LineIntentRail`
- `TasteSignalPopover`
- `SoundDnaLibrary`
- `GenerationDesk`
- `GeneratedTakeTray`
- `TrackGenealogy`
- `SongLab`
- `ReleasePackGate`
- `ProviderStatusLedger`

## Non-Negotiables

- Product-facing name is The Kantikal.
- Parent/band context is sealf'salve.
- Lyrics are the master object.
- Music video is subordinate to song fit.
- It is not SaaS.
- It is not a Suno wrapper.
- It is not a DAW clone.
- It is not a node-board toy.
- Evidence labels must say manual, text-derived, provider-derived, or computed-audio.
- Current `src/styles.css` uses Inter; final design must replace that with the approved typography from `03_DESIGN_SYSTEM.md`.

## Motion/Material Use

- Use Framer Motion for direct UI animation.
- Use Theatre only when a named sequence is worth authoring.
- Use Liquid DOM/Hypercomp for material feel only where readability survives.
- Use Progressive Blur for depth panels, not decorative fog.
- Use VecUI for measured geometry, rails, lineage, and lyric alignment.
