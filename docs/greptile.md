# Greptile Setup

Greptile is installed locally as the Claude plugin at:

- `C:\Users\Issa\.claude\plugins\cache\claude-plugins-official\greptile`
- `C:\Users\Issa\.claude\plugins\marketplaces\claude-plugins-official\external_plugins\greptile`

Codex verified the Greptile HTTP MCP endpoint with the locally shared key on 2026-05-20. The key is not stored in this repo.

Repo review requires a hosted GitHub or GitLab pull request. Local-only work can use the `.greptile` rules plus the local review suite until a PR exists.

Every GitHub pull request runs `.github/scripts/greptile-review.mjs` through the `greptile-review` job in `.github/workflows/ci.yml`. When GitHub exposes the repository secret `GREPTILE_API_KEY`, the job triggers Greptile on the pull request head, waits for completion, and fails the PR when Greptile leaves unaddressed generated comments. When GitHub withholds repository secrets from the PR context, the job falls back to enforcing the live `Greptile Review` app check/status on the same head SHA.

## Review Scope

Greptile must enforce:

- This remains a visual Suno workflow app.
- Music video remains a subfeature of the song workflow.
- Full Suno/provider API coverage remains explicit.
- Perfect lipsync is a hard export gate.
- Destructive cleanup is archive-first, undoable when possible, and audited.
- Secrets remain server-side.
- CI and Greptile gates remain required for every pull request.
