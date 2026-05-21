# The Kantikal - Claude Design Prompt Pack

Use this pack to rapidly finalize the UI/UX for The Kantikal.

## Your Role

You are Claude Design acting as a senior product designer and UI/UX architect.

Do not make a marketing site. Design the actual app.

Output a final UI/UX plan that Codex can implement directly.

## Product

The Kantikal is sealf'salve's private lyrical-musical machine for making songs.

The product is not a wrapper around Suno. It is not a startup/SaaS product. It is a workflow, songbook, room, machine, and ritual object for turning lyrics, taste, references, generations, and branch history into better songs.

Internal implementation/repo name may remain `Suno Visual Studio`. Do not use that as the user-facing brand.

Core thesis:

> Lyrics first, sound breeding second.

The lyrics are roughly 80% of the creative work. The remaining 20% is mixing and matching sounds, voices, hooks, mixes, references, and branches the creator likes.

Music video is a subfeature. It is not the product center.

## Primary Loop

```text
lyrics -> intent map -> Sound DNA -> Suno generation brief -> generated takes -> granular taste decisions -> track genealogy -> Song Lab -> release pack
```

## What The App Must Let The User Do

The user must be able to say:

- I like this lyric line.
- I like this hook.
- I like this vocal texture.
- I like this rhythm but not this verse.
- Keep this mix direction.
- Use this branch's low end.
- This take is cheesy.
- This branch lost the language mix.
- Combine this hook from Take 03 with the vocal from Take 07.
- Generate from this lineage.

The UI must turn that into structured taste memory.

## Product Objects

### Project

One song goal. Holds lyrics, references, generated takes, taste decisions, genealogy, archive, receipts, and release pack.

### Lyric Document

The master object. Each line can have:

- section: intro, verse, pre-hook, hook, bridge, outro
- role: setup, image, turn, payoff, hook, release
- intent: emotional function and delivery direction
- constraints: keep, mutate, avoid
- taste links: liked takes, rejected takes, inherited traits

### Sound DNA

Reusable musical traits learned from references or taste feedback:

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

A generated song/version. It is judged against the lyric document and Sound DNA, not in isolation.

Shows:

- source prompt/provider action
- section map
- waveform strip
- lyric fit
- sound fit
- inherited traits
- drift reasons
- actions: like, dislike, breed, extend, edit, archive

### Taste Signal

A precise user judgment:

```text
target + sentiment + trait + reason + scope + evidence
```

Examples:

```text
hook + like + vocal delivery + intimate/controlled + preserve + manual
verse 2 + dislike + structure + lost momentum + mutate + manual
branch D + combine + mix pressure + better low-end + breed + manual
```

### Track Genealogy

Family tree of versions:

- ancestors: references, prompts, uploads, voices, seeds, models, edits
- descendants: generations, remixes, covers, extensions, stem edits, MV variants
- mutations: tempo, key, structure, lyrics, vocal tone, genre, mix, hook, arrangement
- inherited traits: chorus shape, rhythm, voice, mood, motif, language mix
- dead branches: archived versions with drift reason
- breeding suggestions: combine specific traits from different branches

## Required Screens

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

### 2. Taste Compare

Compare takes by:

- whole take
- lyric line
- section
- vocal moment
- hook
- mix
- instrument
- stem
- branch

Actions:

- like
- dislike
- keep
- mutate
- combine
- archive

### 3. Remix Picker

The user builds a next branch from exact parts:

- hook from one take
- vocal texture from another
- mix pressure from another
- avoid list from archived branches
- lyric constraints from selected section

This is the key "I like this part from this and that part from that" surface.

### 4. Sound DNA Library

Shows reusable traits and anti-signals:

- liked references
- voice targets
- mix targets
- avoided traits
- source evidence for each trait
- manual/text/provider/computed evidence labels

### 5. Generation Desk

Builds the next Suno run from:

- selected lyric section
- project goal
- Sound DNA
- taste decisions
- lineage rules
- provider constraints

Must show exactly what is preserved, mutated, and avoided before generation.

### 6. Track Genealogy

Shows branch history and reasoning.

Every edge must answer:

- what caused this branch
- what changed
- what stayed stable
- why this branch matters or was archived

No decorative node-board theater.

### 7. Song Lab

Post-promising-take repair:

- section repair
- stem edit
- lyric revision
- extension
- cover/remix
- mix direction

### 8. Release Pack

Export and QA:

- final audio
- metadata
- lyrics
- cover/video assets
- MV variants
- lipsync gate
- receipts

MV/lipsync must remain subordinate to song fit.

## Visual Direction

Dark lyric intelligence console.

Use Liquid DOM as the primary interaction/material system:

- Source: https://github.com/AndrewPrifer/liquid-dom
- Target feel: liquid-glass ritual instrument around a lyric/songbook, not frosted SaaS cards.
- Apply it to command surfaces, inspector overlays, Remix Picker, TasteSignal chips, lineage overlays, and generation confirmation layers.
- Do not turn the whole app into a shiny glass demo. The lyric document stays readable and authoritative.
- Liquid DOM is the primary app material system, not a decorative afterthought or optional moodboard reference.
- Runtime guard: its renderer requires WebGPU; DOM-backed `Html` rendering also depends on Chrome's experimental Canvas Draw Element flag.
- Fallback is only a review/runtime guard for missing browser features. It is not an alternate design direction.

Mood:

- lyrical
- musical
- ritual
- private
- serious
- intimate
- precise
- authored
- late-night studio
- intelligent without looking like generic AI software

Do not make it:

- generic SaaS dashboard
- startup product
- DAW clone
- node toy
- Suno wrapper
- marketing landing page
- card wall
- AI-purple gradient app

## Color

Dark primary theme:

- base: `#0f1114`
- surface: `#17191d`
- raised: `#202329`
- lyric ink: `#f4ead9`
- muted: `#aaa094`
- rule: `#34302a`
- primary accent blue: `#74a7ff`
- spend/caution amber: `#e0a84a`
- fit/pass green: `#70d38e`
- drift/archive/fail red: `#e06f5b`

Rules:

- blue is the only brand accent
- amber/green/red are semantic state colors only
- no AI purple
- no blue-purple gradients
- no pure black
- no decorative blobs, orbs, fake glows, or neon haze

## Typography

Recommended:

- lyric object: literary serif only inside lyrics
- app chrome/display: Cabinet Grotesk or Satoshi
- body/UI: Source Sans 3 or equivalent
- data/evidence: IBM Plex Mono or equivalent

Do not use Inter.

The lyric document can feel literary. The controls should feel precise and quiet.

## Layout

Primary shell:

- left rail: project, references, voices, Sound DNA, taste profile, provider status
- center: lyric document as master object
- right inspector: intent analysis, line role, fit reasons, lineage suggestions, gates
- bottom workbench: generated takes, waveform, sections, stems, genealogy, release pack

The lyric document owns the vertical center. Audio tools align to lyric sections, not the other way around.

## Interaction States

Every primary screen must include:

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

## Evidence Rules

No hidden scoring.

Every trait/score must say whether it is:

- manual/user-derived
- text-derived
- provider-derived
- computed-audio

Do not imply audio analysis unless computed audio evidence exists.

## Architecture Constraints

This is final-product coding, not placeholder coding.

Persistence is DB-first:

- SQLite from first implementation
- committed schema/migrations
- server repository layer as only write path
- JSON only for import/export/backups/receipts/debug snapshots
- no localStorage or ad hoc JSON as source of truth

Liquid DOM implementation constraint:

- Primary package for the current React app is `@liquid-dom/react`.
- It is installed and must be treated as the default implementation target.
- Browser proof must check WebGPU availability and nonblank rendering.
- Provide a no-WebGPU review guard without weakening the Liquid DOM-first design.

Provider actions:

- authenticated browser automation is allowed by default
- no Suno credit cap
- record receipts for spend/actions

## Design Deliverable Needed From You

Produce a concise but complete UI/UX finalization pack with:

1. Information architecture.
2. Screen-by-screen layout.
3. Component inventory.
4. State model.
5. Taste feedback interaction model.
6. Remix Picker interaction design.
7. Track Genealogy design.
8. Generation Desk design.
9. Empty/loading/error/archive/unverified states.
10. Mobile/responsive behavior if relevant.
11. Exact decisions Codex needs before implementation.
12. Anything that should be removed because it makes the app feel generic or ugly.

## Current App Contradictions To Resolve

The existing implementation has drifted from the target. Treat these as required cleanup decisions:

1. Current UI says "Track-first visual music studio" and centers a workflow graph. Target is lyric-first console with the lyric document as master object.
2. Current UI uses workflow cards, graph edges, and feature grids. Target bans node-board theater and card-wall UI.
3. Current taste model is closer to whole-track rating/A-B comparison. Target requires granular TasteSignal across section, line, vocal, hook, mix, stem, and branch.
4. Current app lacks a dedicated Sound DNA Library surface. Target requires reusable traits and anti-signals with source evidence.
5. Current persistence uses browser localStorage. Target is SQLite + server repository/routes, no localStorage source of truth.
6. Current styles drift into Inter/system stack, near-pure black, teal/amber accents, and gradients. Target is no Inter, no pure black, blue primary, semantic state colors.
7. Current Suno execution path is not fully resolved. Target allows authenticated browser/API automation by default and still needs the clean final UI surface for execution receipts.
8. MV appears in several surfaces. Target allows MV but keeps it subordinate to song fit and release QA.

## Decision Defaults

Use these defaults unless you have a strong reason to challenge them:

- DB stack: SQLite + plain SQL migrations + repository layer.
- Taste labels: Fit, Drift, Inherited confidence, Blocker.
- First screen: dense studio console, lyric document centered.
- Taste authority: explicit user judgments outrank computed analysis.
- MV: subordinate release asset workflow, not central nav.
- UI density: operational/studio, not sparse marketing.

## First Question To Answer

Is the primary app frame correct?

Recommended answer:

```text
Yes: left rail + lyric center + right inspector + bottom workbench.
```

If no, propose the replacement frame.

## Output Format

Use this structure:

```markdown
# The Kantikal UI/UX Finalization

## Final App Frame
...

## Screen Map
...

## Core Components
...

## Taste Interaction Model
...

## Remix Picker
...

## Track Genealogy
...

## Generation Desk
...

## State Model
...

## Visual System
...

## Implementation Notes For Codex
...

## Decisions Still Needed From Issa
...
```

Be direct. Do not write filler. Do not pitch the product. Finalize the UI/UX so Codex can build.
