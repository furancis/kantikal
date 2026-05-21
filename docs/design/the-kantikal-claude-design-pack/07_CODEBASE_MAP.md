# The Kantikal Codebase Map

The current app is Vite + React + TypeScript.

## Main Files

- `src/App.tsx`: current full app shell and workflow UI.
- `src/styles.css`: current styling surface.
- `src/main.tsx`: React entrypoint.
- `src/domain/workflow.ts`: project, generation, genealogy, Song Lab, release-pack logic.
- `src/domain/tasteProfile.ts`: taste gate and prompt-lock logic.
- `src/domain/audioAnalysis.ts`: waveform/fit analysis.
- `src/api/*`: provider, export, runtime, project-store adapters.
- `server/*`: provider/runtime server-side routes and handlers.
- `e2e/studio.spec.ts`: browser workflow checks.

## Current Product Shape

The UI already has these object lanes:

- project lobby
- idea brief
- lyrics sheet
- style stack
- voice/persona
- source assets
- generation batch
- version comparison
- track genealogy
- audio intelligence
- Song Lab
- music video lane
- job queue
- release pack
- local library
- downloads/exports
- provider/API coverage

Claude Design must make these feel like The Kantikal, not replace them with a generic dashboard.

## Installed Design Packages

- `framer-motion`
- `framer-motion-theatre`
- `@theatre/core`
- `@theatre/studio`
- `hypercomp`
- `vecui`
- `@liquid-dom/core`
- `@liquid-dom/layout`
- `@liquid-dom/react`
- `@liquid-dom/three`
- `@liquid-dom/r3f`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `lucide-react`

## Output Mapping

Claude Design output must include:

- `tokens.css` -> replace/refactor `src/styles.css` tokens.
- `AppShell.tsx` -> maps to `src/App.tsx` shell areas.
- `LyricConsole.tsx` -> lyric master object in center.
- `TasteInspector.tsx` -> right-side intent/taste/evidence panel.
- `GenerationDesk.tsx` -> next-run composer.
- `TrackGenealogy.tsx` -> branch and inheritance view.
- `SongLab.tsx` -> selected track repair/edit area.
- `ReleasePack.tsx` -> export/provenance gate.
- `motion-spec.json` -> Framer Motion/Theatre sequences.
- `wire-map.md` -> exact file-to-file implementation map.
