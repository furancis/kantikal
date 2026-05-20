# CI and PR Gates

## Required Checks

Every pull request must pass the `verify` job:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`
- `npm audit --audit-level=moderate`
- `npm run scan:credentials`
- `npm run scan:wording`

The workflow lives at `.github/workflows/ci.yml`.

## Greptile Gate

Every pull request must also pass `greptile-review`.

The job calls `.github/scripts/greptile-review.mjs`, which:

- requires the repository secret `GREPTILE_API_KEY`
- triggers Greptile on the pull request head SHA
- polls until the head review reaches a terminal state
- fails if Greptile does not complete
- fails if Greptile reports unaddressed generated comments after the review starts

The key is never stored in the repo. Configure it as a GitHub repository secret named `GREPTILE_API_KEY`.

## Branch Protection

Mark these PR checks as required before merge:

- `verify`
- `greptile-review`
- Greptile's own status check, when GitHub exposes it separately

Do not bypass the Greptile gate for changes that touch workflow shape, provider boundaries, lipsync export, release packs, cleanup, docs, or CI config.
