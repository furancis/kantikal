# State Matrix

Per `01_PASTE_INTO_CLAUDE_DESIGN.md` every primary screen needs explicit
**empty**, **loading**, **error**, **active selection**, **archived branch**,
**unverified evidence**, **provider unavailable**, **auth missing**, **import
pending**, **generation receipt recorded** states. The design surfaces all of
them; this matrix documents the visual / copy contract per screen so Codex
implements consistently.

Convention:
- **Body language** = how the screen LOOKS in that state (layout, color, copy)
- **Affordance** = what the user CAN do from that state
- **Hard rule** = anything that must not regress

## 1. Lyric Console

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** (no lyrics) | Center holds a single line of editorial copy: "Start the song." plus a Fraunces 700 placeholder line that says `[ first line — type or paste ]`. Workbench shows the empty glyph. Rail shows the project card with `0 takes`. | Type/paste lyric, import .txt, paste from clipboard | The lyric document is the master — even empty, the rest of the screen is subordinate. No marketing CTAs. |
| **loading** | Center shows the lyric in 0.45 opacity. Workbench fades the take cards to skeleton bars. No spinner — a horizontal sweep of `--kk-blue-wash` runs across the workbench band every 1.8s. | All controls disabled. | No generic spinner. |
| **error** | A single-row error pill above the workbench: `provider · suno · refused (auth). retry` in `--kk-red`. Rail provider pill flips to `is-down`. | Retry · sign-in flow · ignore (keeps the rest of the app usable) | Never block the lyric document. |
| **active selection** | Selected line gets the inset 2px accent bar + horizontal wash. Inspector populates. Workbench filters to takes whose section overlaps the selection. | All taste actions enabled on the selected line. | Selection is single-line by default; shift-click extends to a range. |
| **archived branch (active)** | If the active take is archived, its card is dashed-border + 0.55 opacity + a small `archived` mono pill. | Restore · view archive reason · breed from anyway (with warning). | Archive is reversible. |
| **unverified evidence** | When a fit score has no audio-derived evidence, the score is **withheld** — show `—` with an amber `unverified` evidence pill. Never show a numeric score from text-derived guessing. | Click pill to see why · request analysis (queued) | Never display a numeric score backed only by inference. |
| **provider unavailable** | Topbar provider pill `is-down`. Workbench shows received takes in normal state; new-generation button is disabled with a tooltip explaining the outage. | Retry · switch provider · keep editing lyrics. | The studio keeps working without the provider. |
| **auth missing** | Topbar provider pill `is-warn` with text `auth · sign in`. A small banner sits above the workbench. | Sign-in flow opens in side drawer. | Don't redirect — drawer only. |
| **import pending** | A monospace receipt line sits at the bottom of the workbench: `importing · 2 / 4 takes · t-09 received`. Take cards fade in as they arrive. | Cancel import · view progress. | Imports never block taste work on existing takes. |
| **generation receipt recorded** | The receipt block in the inspector / desk shows the new receipt with a green pulse on the id. Workbench scrolls to the new takes group with a 320ms ease-out. | Open receipt · listen to first take · breed. | Receipts are append-only and pinned. |

## 2. Taste Compare

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** | "Add 2+ takes to compare." with a button. | Pick from workbench · open Remix Picker with picks queued. | Never compare to fewer than 2 takes. |
| **active scope** | Selected axis row highlighted with `--kk-blue-wash`. Cells across that row gain interaction targets. | Mark like/dislike/keep/mutate/combine/archive per cell. | A judgment is always a TasteSignal — `target + sentiment + trait + reason + scope + evidence: manual`. |
| **archived take column** | Header shows `archived` mono pill; column desaturates by 50%. | Restore · view drift reason. | Archived takes still appear so the user can see what was rejected and why. |
| **unverified row** | The `audio causality` row is always present with `—` and an amber pill. | Schedule analysis (no-op until pipeline ships). | Honest about evidence. |

## 3. Remix Picker

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** (no picks) | Five columns shown empty with a placeholder tile in each: `[ pick from compare / workbench ]`. | Drag from workbench · open Taste Compare with picks queued. | Always five columns: hook · vocal · mix · language · avoid. |
| **partial** | Picked columns show their tile in `is-picked` (blue/faery border). Unpicked columns show candidates. | Swap · remove · add from compare. | Min 1 preserve + 0 avoid is enough to ship; more is fine. |
| **ready** | Footer summary updates: `04 picks queued · 03 preserve · 01 anti-signal · lineage parent set`. Send button enabled. | Send to Generation Desk. | Sending only stages the brief — no spend yet. |

## 4. Sound DNA Library

Only screen where evidence is loud by default — it IS the audit surface.

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** | "No traits yet. Add taste signals and the system will learn from them." | Walk through onboarding example. | Empty DNA is honest — never seed it with fake traits. |
| **all-manual mix** | Evidence-mix inspector shows 100% manual with no computed-audio. The amber warning row reads `no computed-audio evidence yet — taste claims may not be audio-causal`. | Schedule computed-audio analysis. | Surface this prominently. |
| **anti-signal heavy** | If anti-signals outnumber traits, layout doesn't change — but inspector shows a sage note: `you've documented more about what NOT to do than what to keep. consider adding traits.` | Add traits from selected takes. | The library tolerates anti-heavy patterns. |

## 5. Generation Desk

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** | "Bring picks from Remix Picker or start a clean brief." | Compose by hand · open Picker. | A run is always a structured brief — no free-text prompt. |
| **diff vs parent** | Default view. Verbs colored: preserve/mutate/avoid/add. Prompt assembly panel mirrors the diff as IBM Plex Mono key/value. | Edit any row · re-source from compare. | Brief diff is always against the parent branch. |
| **policy warn (unverified)** | Spend preview shows a warn row: `audio causality · no computed-audio proof; score withheld`. Run button still enabled (does not block). | Run anyway · schedule analysis. | Withheld != blocked. |
| **receipt pending** | After submit: receipt id appears in inspector with status `pending`. Takes appear as they arrive in the workbench. | Cancel run (best-effort) · open receipt. | Receipt id is allocated client-side and matched to provider id on ack. |

## 6. Track Genealogy

| state | body language | affordance | hard rule |
|---|---|---|---|
| **empty** (first run) | Only one lane (A · reference draft) with one seed node. | First generation creates the first branch. | Never show a node board until there's lineage to show. |
| **active branch** | The active lane has `--kk-blue-wash` background and accent edges. Current node has the glow + blue border. | Focus lineage · continue branch. | Time flows left → right. Lanes are branches, not nodes. |
| **archive lane** | Bottom lane is dashed-border, separated by extra row gap. Archive nodes have a red square indicator. | Restore · view reason · drift comparison. | Archive lane is always visible — design honesty. |
| **merge node** | Diamond shape (rotate 45°) in green. Edge color green. | Inspect what merged from which sources. | Merges are explicit and labelled. |

## 7. Song Lab

| state | body language | affordance | hard rule |
|---|---|---|---|
| **no selection** | Timeline shows the take with no section selected. Operations grid is disabled with placeholder copy. | Pick a section to enable ops. | Ops apply to selections, never whole-take by default. |
| **operation queued** | Queue list in the right inspector. `run queue · N cr` button updates. | Run · clear queue · reorder. | Queue is local until run — no spend. |
| **destructive op** | Mix direction or lyric revision pre-runs through a confirmation modal showing the diff. | Confirm · cancel. | Lyric revision always shows old → new diff. |

## 8. Release Pack

| state | body language | affordance | hard rule |
|---|---|---|---|
| **gates passing** | Audio · mix · taste · provenance: green stat. Audio causality: amber (unverified ≠ blocker). | Export pack. | Audio causality being unverified DOES NOT block audio export. |
| **gate failing** | Failing gate shows red stat + reason. Export button disabled with a single-line explanation. | Fix gate · review take · open Song Lab. | Don't allow override of a failed lyric / mix gate. |
| **MV tab visible** | Only when MV assets exist. Tab marked `subordinate`. Lipsync gate per variant. | View MV · lipsync test. | MV lipsync gate ONLY blocks MV exports, not audio. |
| **no MV assets** | MV tab does not render. | Add cover/video assets to unlock. | Don't show empty MV tab. |

## Global states

- **proof mode** on (topbar lock icon → blue/faery) → every evidence pill on every score becomes visible. Otherwise quiet by default.
- **prefers-reduced-motion** → fabric pauses (freeze at t=0), branch-creation collapses to a 60ms cross-fade, gate-pass loses the stagger but keeps the green state.
- **shell hidden / offscreen** → fabric pauses, generation polling backs off.
