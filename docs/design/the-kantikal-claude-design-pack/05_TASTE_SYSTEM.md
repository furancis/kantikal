# Taste System - The Kantikal

## Purpose

The Taste System turns lyric intent and user judgment into directed song breeding for The Kantikal, sealf'salve's private lyrical-musical machine. It is the reason this app is not a Suno wrapper.

The user does not only say "good" or "bad." The user says:

- keep this hook
- keep this vocal texture
- keep this rhythm but not this verse
- combine this mix with that section
- this is cheesy
- this lost the language mix
- this branch drifted

The system captures those judgments as reusable taste memory and uses them to shape the next generation.

## Authority Order

1. Lyrics define the song's intent.
2. User taste decisions define what worked or failed.
3. Sound DNA turns repeated judgments into reusable traits.
4. Lineage explains what changed and what stayed stable.
5. Provider actions execute the next attempt.

Audio intelligence can strengthen the system later, but it cannot replace explicit user taste.

## Taste Objects

### TasteSignal

A precise user judgment.

Fields:

- target: take, section, line, vocal moment, hook, mix, instrument, stem, branch
- sentiment: like, dislike, keep, mutate, combine, archive
- trait: vocal texture, rhythm, hook shape, mix pressure, language mix, low-end, arrangement, lyric fit
- reason: intimate, cheesy, generic, too bright, wrong voice, strong payoff, lost identity
- scope: preserve, avoid, breed, local-only, global
- evidence: manual, text-derived, provider-derived, computed-audio

### SoundTrait

A reusable musical preference learned from signals.

Examples:

- controlled intimate vocal
- chorus with earlier payoff
- low-end present but not club-heavy
- bilingual switch must stay audible
- avoid generic inspirational pop lift

### AntiSignal

A thing to avoid because it reliably causes drift.

Examples:

- cheesy ad-lib
- overbright vocal stack
- genre drift into generic EDM
- hook loses lyric identity
- mix buries language switch

### LineageRule

A rule for the next branch.

Examples:

- preserve hook from take 03
- use vocal texture from take 07
- avoid verse phrasing from take 05
- combine bridge rhythm from branch B with mix pressure from branch D

### BranchFit

Visible explanation of a branch.

Fields:

- lyric fit
- sound fit
- inherited traits
- drift reasons
- blockers
- next mutation
- archive reason

## Feedback Grammar

Plain language maps to structured taste:

`target + sentiment + trait + reason + scope + evidence`

Examples:

`hook + like + vocal delivery + intimate/controlled + preserve + manual`

`verse 2 + dislike + structure + lost momentum + mutate + manual`

`branch D + combine + mix pressure + better low-end + breed + manual`

## UX Surfaces

### Lyric Console

Taste begins on the lyric document. Selecting a line or section filters takes, traits, and branch suggestions to that lyric scope.

### Comparison Tray

Generated takes are compared by section, not only as whole tracks. The user can mark exact liked parts from multiple takes.

### Remix Picker

The user can build a next branch from parts:

- hook from one take
- vocal texture from another
- mix pressure from another
- avoid list from archived branches
- lyric section constraints from the document

### Sound DNA Library

Reusable traits and anti-signals live here with source evidence.

### Track Genealogy

Every branch shows inherited traits, mutations, fit, drift, and archive reasons.

## Scoring Rules

Scores must be explainable and bounded.

- Fit score means alignment with selected lyric intent and selected taste signals.
- Drift score means distance from preserved traits or presence of anti-signals.
- Inherited confidence means how clearly a branch appears to carry a selected trait.
- Blockers are stronger than scores.

No score can imply audio analysis unless computed-audio evidence exists.

## Autonomous Build Blockers

1. Suno execution path must be verified before real generation can be automated.
2. Credit spend has no cap by user approval, but every spend/action needs a receipt.
3. Authenticated browser/API authority must exist before provider actions can run.
4. Persistence target must be chosen for taste memory and lineage.
5. Computed audio claims require real audio analysis, not UI labels.
6. MV/lipsync claims require real video pipeline proof.
7. Third-party UI/motion dependencies must be installed before import.
8. Reference assets need provenance labels.

## Acceptance Criteria

- User can attach taste to exact sections and moments.
- User can combine liked parts from multiple takes into one next generation brief.
- User can see why a branch fits or drifted.
- User can archive without losing evidence.
- The next generation brief reflects lyrics, liked traits, anti-signals, and lineage.
- The system never pretends inferred taste is proven audio analysis.
