# Design System - The Kantikal

## Product Context

The Kantikal is sealf'salve's private lyric-first music generation workstation. The app treats lyrics as the source of creative intent, then uses liked sounds, voices, mixes, references, seeds, models, and lineage to steer Suno generations toward that intent.

`Suno Visual Studio` is the repo/internal implementation name. It is not the user-facing brand.

This is for one serious creator using a private local workflow. It does not need generic multi-user SaaS polish. It needs taste, memory, evidence, and control.

## Design Thesis

**Lyrics first, sound breeding second.**

The first screen must communicate that the song is written in the lyrics. Audio generation, waveform analysis, track genealogy, Song Lab edits, and music video generation are supporting systems that help the lyric become the right track.

## Aesthetic Direction

**Direction:** The Kantikal

The interface should feel like opening a private songbook, room, machine, and ritual object for sealf'salve to make songs. It should not feel like a generic dashboard, node toy, DAW clone, startup product, SaaS tool, or Suno wrapper.

**Mood:** lyrical, musical, ritual, private, serious, intimate, precise, authored, late-night studio.

**Decoration:** intentional, not expressive. The visual language comes from lyrics, section marks, waveforms, fit states, and lineage evidence. No decorative blobs, gradients, cards-for-everything, or fake music imagery.

**Material system:** Liquid DOM is the primary UI material system. Use it for ritual instrument surfaces around the lyric object: command glass, inspector overlays, Remix Picker layers, TasteSignal chips, lineage overlays, and generation confirmation layers. The no-WebGPU path is only a runtime/review guard; it must not become a separate visual direction.

## Typography

- **Lyric object:** Fraunces, 650-760 weight. Used only inside the lyric document and lyric-derived editorial treatments.
- **Display/UI:** Cabinet Grotesk or Satoshi, 500-800 weight. Used for app chrome, section titles, navigation, and command surfaces.
- **Body/UI:** Source Sans 3, 400-750 weight. Used for controls, panels, forms, labels, and explanations.
- **Data/evidence:** IBM Plex Mono, 400-600 weight. Used for line numbers, tempo, key, scores, IDs, seeds, model names, version labels, and QA receipts.

Lyrics need literary weight. Controls need to disappear. Evidence needs to look measurable.

## Color

Dark primary theme:

- **Base:** `#0f1114`
- **Surface:** `#17191d`
- **Raised surface:** `#202329`
- **Lyric ink:** `#f4ead9`
- **Muted text:** `#aaa094`
- **Rule:** `#34302a`
- **Primary accent:** `#74a7ff` for selected lineage, active lyric section, current branch
- **Spend state:** `#e0a84a` for generation, credit spend, unresolved risk
- **Fit state:** `#70d38e` for passed fit, inherited traits, approved sections
- **Drift state:** `#e06f5b` for cheesy drift, dead branches, failed gates

Rules:

- Color is semantic, not decorative.
- Blue means selected/active.
- Amber means spend or caution.
- Green means fit/pass.
- Red means drift/archive/fail.
- Blue is the only brand accent. Amber, green, and red are status colors only.
- Do not use AI-purple, blue-purple gradients, pure black, decorative glow fields, blobs, or generic neon.

## Layout

Primary app shell:

- **Left rail:** project, references, voices, style DNA, taste profile, provider status.
- **Center:** lyric document as master object.
- **Right inspector:** intent analysis, line role, fit reasons, lineage suggestions, gates.
- **Bottom workbench:** generated takes, waveform, sections, stems, genealogy, release pack.

The lyric document owns the vertical center. Audio tools align to lyric sections, not the other way around.

## Components

- **Lyric Line:** line number, lyric text, intent tags, section role, keep/mutate flags.
- **Intent Tag:** hook, setup, image, turn, bridge, language switch, pressure, release.
- **Generated Take:** version, source prompt, fit score, drift reason, inherited traits, waveform strip.
- **Taste Chip:** liked vocal, liked hook, disliked cheesy phrase, keep low-end, mutate tempo.
- **Lineage Card:** ancestor, descendant, mutation, inherited trait, branch fit, dead branch.
- **Release Gate:** audio fit, lyric fit, mix fit, MV/lipsync pass.

## Interaction States

Every primary surface needs explicit states:

- **Empty:** no lyrics, no references, no takes, no taste decisions.
- **Loading:** generation pending, analysis pending, import pending, provider check pending.
- **Error:** provider unavailable, auth missing, credit risk, malformed lyric map, failed import.
- **Active:** selected lyric line, selected take, selected branch, selected trait.
- **Archived:** dead branch with reason and recover action.
- **Unverified:** any score or trait that is inferred but not proven by audio analysis.

## Motion

Motion is functional:

- selected lyric line highlights related takes and branches
- liking a section leaves a small persistent taste marker
- generating shows branch creation, not generic loading
- archive moves a branch to a visible dead-branch lane

No playful bounces. No decorative motion.

## Non-Negotiables

- Music video is a subfeature.
- Perfect lipsync is a hard export gate.
- API/provider coverage must be visible but not visually dominant.
- Destructive cleanup is archive-first.
- The app must support "I like this section from this take and that mix from that branch."
- No generic SaaS dashboard, no card wall, no node-board theater, no DAW clone.
- No `Inter` font.
- No hidden scoring. Evidence must say whether it is manual, text-derived, provider-derived, or computed.
- UI implementation must begin with a `<design_plan>` before code changes when applying `$gpt-taste`.

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-05-21 | Dark lyric intelligence console | User liked the lyric-first direction but requested dark primary theming. |
| 2026-05-21 | Lyrics are the master object | User clarified lyrics are roughly 80 percent of the creative work. |
| 2026-05-21 | Taste feedback must be granular | User wants to say "I like this section from this, that part from that" and remix from those signals. |
