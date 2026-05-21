# UX Model - The Kantikal

Product-facing name: **The Kantikal**.

Parent/band context: **by / for sealf'salve**.

Internal implementation/repo name may remain `Suno Visual Studio`.

## Product Spine

`lyric intent -> sound DNA -> generated takes -> taste decisions -> track genealogy -> song lab -> release pack`

The app must feel like opening The Kantikal: the band's private lyrical-musical machine. It must understand what the user is trying to make, not just dispatch generations.

## Main Objects

### Project

Container for one song goal. Holds lyrics, references, generated takes, taste decisions, genealogy, archive, and release pack.

### Lyric Document

The master object. Each line can carry:

- section: intro, verse, pre, hook, bridge, outro
- role: setup, image, turn, payoff, hook, release
- intent: emotional function and delivery direction
- constraints: keep, mutate, avoid
- taste links: liked takes, rejected takes, inherited sound traits

### Sound DNA

Reusable traits extracted from references or user feedback:

- voice texture
- rhythm feel
- mix pressure
- hook shape
- low-end direction
- language mix
- instrument palette
- tempo/key preference
- avoid list

### Generated Take

A generated track or version. It is not judged alone. It is judged against the lyric document and Sound DNA.

Each take shows:

- source prompt and provider action
- section map
- waveform strip
- lyric fit
- sound fit
- inherited traits
- drift reasons
- actions: like, dislike, breed, extend, edit, archive

### Taste Decision

A user judgment attached to a precise target:

- whole take
- lyric line
- section
- vocal moment
- hook
- mix
- instrument
- stem
- branch

The decision must capture why:

- works
- too generic
- too cheesy
- wrong voice
- wrong energy
- wrong structure
- keep this trait
- combine with another branch

### Track Genealogy

Family tree of creative versions:

- ancestors: references, prompts, uploads, voices, seeds, models, edits
- descendants: generations, remixes, covers, extensions, stem edits, MV variants
- mutations: tempo, key, structure, lyrics, vocal tone, genre, mix, hook, arrangement
- inherited traits: chorus shape, rhythm, voice, mood, motif, language mix
- dead branches: archived versions with drift reason
- breeding suggestions: combine specific traits from different branches

## Primary Screens

### 1. Lyric Console

Default screen.

Center:

- lyric document
- line-level tags
- selected section
- keep/mutate/avoid controls

Right:

- line intent
- fit evidence
- suggested Sound DNA
- branch recommendations

Bottom:

- generated takes aligned to selected lyric section
- waveform and section map
- like/dislike/breed/archive controls

### 2. Sound DNA Library

Shows the reusable sound traits the app has learned.

Includes:

- liked references
- voice targets
- mix targets
- avoided traits
- source evidence for each trait

### 3. Generation Desk

Builds the next Suno run from:

- selected lyric section
- project goal
- Sound DNA
- taste decisions
- lineage rules

The user should see exactly what is being preserved, mutated, and avoided before credits are spent.

### 4. Track Genealogy

Shows family tree and branch reasoning.

The graph is not decorative. Every edge must answer:

- what caused this branch
- what changed
- what stayed stable
- why this branch matters or was archived

### 5. Song Lab

Section and stem edits after a promising take exists.

Includes:

- section repair
- stem edit
- lyric revision
- extension
- cover/remix
- mix direction

### 6. Release Pack

Export and QA stage.

Includes:

- final audio
- metadata
- lyrics
- cover/video assets
- MV variants
- lipsync gate
- receipts

## Feedback Grammar

The UI must support natural user judgment:

- "I like this line."
- "I like this vocal texture."
- "I like this hook but not the verse."
- "Keep this rhythm."
- "Use this mix direction."
- "This is cheesy."
- "This lost the language mix."
- "This branch drifted."
- "Combine this hook with that vocal."
- "Generate from this lineage."

Each statement becomes structured feedback:

`target + sentiment + trait + reason + scope`

Example:

`hook section + positive + vocal delivery + intimate/controlled + preserve`

## Build Contract

After plan approval, build the product autonomously as one coherent app, not slice by slice or tranche by tranche.

What we are making:

1. A dark lyric-first studio where the lyric document is the command surface.
2. A granular taste system that lets the user mark exact liked/disliked parts across takes, sections, vocal moments, hooks, mixes, stems, and branches.
3. A Sound DNA layer that converts those judgments into reusable traits, anti-traits, and generation constraints.
4. A generation desk that assembles the next Suno prompt/run from lyric intent, Sound DNA, taste decisions, provider constraints, and lineage.
5. A track genealogy surface that shows what changed, what stayed stable, what inherited taste, and why branches were kept or archived.
6. A Song Lab for repairing and extending promising branches.
7. A release pack with lyric/audio/mix/MV gates, where music video remains subordinate to song fit.

No heavy audio embeddings are required to start, but the UI must label evidence honestly: manual/user-derived, text-derived, provider-derived, or computed audio-derived.

## Up-Front Blockers

These are the foreseeable blockers that must be accepted or resolved before autonomous build starts:

1. Suno access path: direct API, browser automation, or manual import/export must be chosen from the live available path. If no stable write path exists, generation actions become prepared briefs plus import slots until access is verified.
2. Credit spend boundary: user approved no credit cap. Still record receipts for every spend/action.
3. Auth/browser authority: authenticated browser automation is approved by default unless user states otherwise. Keep it hidden/non-foreground where possible.
4. Audio proof boundary: without embeddings/stem analysis wired, taste scores cannot claim real audio causality. They must remain user/text/provider evidence until audio intelligence is implemented.
5. Storage boundary: generated takes, lineage, taste decisions, references, archives, and receipts must persist in a real database from the first implementation. Default target is SQLite behind server repository/routes. JSON is allowed only for explicit import/export, backups, receipts, and debugging snapshots.
6. Provider contract drift: Suno surfaces, limits, and capabilities can change. Provider actions must be wrapped behind adapters and surfaced as verified/unverified.
7. Asset rights: uploaded references, covers, and MV assets need local provenance labels. The app should not imply commercial clearance.
8. Lipsync gate: perfect lipsync can be a release gate, but it cannot be promised until the actual MV pipeline is tested on real outputs.
9. Design dependency gate: Liquid DOM is the primary material system and `@liquid-dom/react` is installed. Full rendering still requires WebGPU and Chrome Canvas Draw Element for DOM-backed `Html`; fallback is only a runtime/review guard. Do not import GSAP, Framer Motion, Tailwind, or shadcn without installing and verifying.
10. Visual proof gate: after UI implementation, browser screenshots and interaction checks are required before claiming the design works.

## Acceptance Criteria

- User can select a lyric line or section.
- User can mark what they like or dislike in a take.
- User can choose "breed from this" using liked traits.
- User can archive a dead branch with a reason.
- User can see a generated brief that reflects lyric intent and taste decisions.
- UI keeps MV/lipsync subordinate to audio and lyric fit.
- The screen visually matches `DESIGN.md`.
