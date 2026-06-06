# The Kantikal Build Plan

## Approval Target

Build one coherent lyric-first music generation studio, not a slice/tranche sequence.

No UI implementation starts until this plan is approved.

## Product

The Kantikal is sealf'salve's private lyrical-musical machine: a dark lyric intelligence console for making songs.

`Kantikal` remains the repo/internal implementation name only.

Primary loop:

`lyrics -> intent map -> Sound DNA -> music generation brief -> takes -> granular taste decisions -> branch genealogy -> Song Lab -> release pack`

Lyrics remain the authority. Taste decisions and Sound DNA steer generation. Music video is subordinate.

## Screens

1. Lyric Console
   - Center lyric document.
   - Line/section selection.
   - Intent tags, keep/mutate/avoid flags.
   - Related takes aligned to selected lyric scope.

2. Taste Compare
   - Compare takes by whole track, section, line, vocal moment, hook, mix, stem, branch.
   - Actions: like, dislike, keep, mutate, combine, archive.
   - Every judgment stores target, trait, reason, scope, evidence.

3. Remix Picker
   - Build next branch from parts:
     - hook from one take
     - vocal texture from another
     - mix from another
     - avoid list from archives
     - lyric constraints from selected section

4. Sound DNA Library
   - Reusable liked traits and anti-signals.
   - Source evidence for every trait.
   - Manual/text/provider/computed labels.

5. Generation Desk
   - Shows exact next provider brief before execution.
   - Uses lyric intent, Sound DNA, taste decisions, lineage rules, provider constraints.
   - Browser automation/API path allowed by default.
   - No credit cap; record receipts.

6. Track Genealogy
   - Branch tree with ancestors, descendants, mutations, inherited traits, drift reasons, archive reasons.
   - No decorative node theater.

7. Song Lab
   - Repair promising branches.
   - Section edit, extension, cover/remix, stem/mix direction, lyric revision.

8. Release Pack
   - Final audio, lyrics, metadata, cover/video assets, receipts.
   - MV/lipsync gate exists but does not dominate the product.

## Data Model

Database-first from the first implementation. No placeholder local JSON app state.

Final product persistence:

- project
- lyric document
- Sound DNA
- generated takes
- taste signals
- lineage branches
- archive reasons
- generation receipts
- release pack

Persistence shape:

- SQLite database for the local studio runtime.
- Server-side repository layer as the only write path.
- Schema and migrations committed with the app.
- JSON only for explicit import/export, backups, receipts, and debugging snapshots.
- No `localStorage` or ad hoc JSON files as the source of truth.
- Future Postgres/hosted sync must use the same repository boundary.

## UI Direction

- Product-facing name: The Kantikal.
- Parent/band context: by / for sealf'salve.
- The app should feel like opening a private songbook/ritual instrument, not launching SaaS.
- Dark primary theme.
- No generic SaaS dashboard.
- No AI-purple/blue-purple gradients.
- No pure black.
- No card wall.
- No node-board theater.
- No Inter.
- Lyric typography lives inside the lyric object only.
- Controls use high-end product typography.
- One primary accent: blue. Amber/green/red are state colors only.

## States

Every screen needs:

- empty
- loading
- error
- active selection
- archived branch
- unverified evidence
- provider unavailable
- auth missing
- import pending
- generation receipt recorded

## Foreseeable Blockers

Resolved:

- Credit cap: none.
- Authenticated browser automation: allowed by default.

Still product/technical boundaries:

- provider execution path must be verified live.
- Computed audio claims require real audio analysis.
- Lipsync claims require real MV pipeline proof.
- Reference assets need provenance labels.
- Liquid DOM is the primary material system and `@liquid-dom/react` is installed.
- Browser proof must verify WebGPU and Canvas Draw Element before claiming full Liquid DOM rendering.
- Browser visual proof is required before claiming UI quality.

## Build Order After Approval

1. Inspect current app structure and tests.
2. Lock current behavior with targeted tests where needed.
3. Implement SQLite schema, migrations, and repository layer.
4. Wire server runtime routes to the database.
5. Build the Liquid DOM primary app shell around the lyric document.
6. Build Taste Compare and Remix Picker.
7. Build Sound DNA Library.
8. Build Generation Desk and receipt model.
9. Build Track Genealogy.
10. Build Song Lab and Release Pack surfaces.
11. Verify with tests, typecheck, browser smoke, screenshots, and interaction checks.

## No Placeholder Coding

Implementation must target the final product shape:

- Real DB persistence, not mocked state.
- Real route/repository boundaries, not component-local state pretending to be storage.
- Real provider adapter boundaries, even when an action is not yet automated.
- Real receipt model for generation, browser/API actions, imports, exports, and spend.
- Real empty/error/loading/archived/unverified states.
- Real tests around behavior and data invariants.

Temporary UI copy is allowed only to expose a real state or unfinished integration honestly.
