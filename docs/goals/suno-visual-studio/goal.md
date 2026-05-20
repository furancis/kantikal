# Goal: Real Suno Visual Studio

## Original Ask

Build the real Suno Visual Studio: a functional, TDD-built, Greptile-reviewed visual app for the full Suno music generation workflow.

## Correction

The prior tranche produced a PRD, repo, static visual shell, tests, and Greptile-reviewed PR. That is not the full app.

## Target Result

A working Claude Design-style visual application where a user can run the Suno workflow end to end through Printing Press / logged-in Suno web first. Mocked/local adapters remain test scaffolding, and third-party Suno-compatible provider adapters are optional only after live proof:

brief -> prompt/lyrics/style/voice -> Suno generation batches -> compare/rate/version -> Song Lab edits/stems -> optional Music Video Lane -> lipsync QA -> release pack.

## Non-Negotiables

- Claude Design reference only; no static one-off chat surface framing.
- Visual app first; Printing Press / logged-in Suno web is the primary hidden engine, while third-party Suno-compatible adapters and ComfyUI are optional helpers.
- Music video is a subordinate lane opened from a selected song/version.
- Full Suno/provider API capability coverage is maintained.
- Perfect lipsync is a hard export gate: phoneme, frame, mouth-shape, segment drift, and post-stitch checks.
- Destructive cleanup is archive-first and previewed.
- API keys and secrets stay server-side.
- TDD: tests describe each behavior before implementation is accepted.
- Every PR must pass local verification and Greptile review.

## Likely Misfire

Calling a scaffold, PRD, static UI, or mocked demo "the app." That is not complete.

## Completion Proof

- Real workflow state machine with tests.
- Provider abstraction with mocked Suno-compatible adapter and server-only secret boundary.
- Visual canvas can create, update, compare, and route workflow objects.
- Music video lane is subordinate and blocked by lipsync QA until passing.
- API coverage ledger is enforced by tests.
- Release pack output is generated from workflow state.
- CI runs lint, typecheck, unit, build, E2E, audit, scans, and Greptile review for PRs.
- Final PM/Judge audit maps receipts to the full original ask and says `full_outcome_complete: true`.

## Starter Command

`/goal Follow docs/goals/suno-visual-studio/goal.md.`
