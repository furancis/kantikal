# Kantikal

Dynamic visual app for the whole music generation workflow.

Core shape:

`brief -> prompt/lyrics/style/voice -> provider batches -> compare/rate/version -> Song Lab edits/stems -> optional Music Video Lane -> release pack`

Non-negotiables:

- Visual app first.
- Full provider API coverage.
- Music video is a subfeature, not the product center.
- Perfect lipsync is a hard export gate.
- Destructive cleanup is archive-first with receipts.
- Provider secrets stay server-side.

Start:

```powershell
npm ci
npm run dev
```

Verify:

```powershell
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run scan:credentials
npm run scan:wording
```

Provider/API shape:

- Client UI uses fetch-backed provider and export clients, with local mock fallback only when the HTTP route is absent.
- Vite dev mounts `/api/provider/*` for generation/action dispatch and `/api/provider-exports/*` for export hydration, polling, callbacks, and video-output records.
- Real compatible-provider HTTP dispatch lives under `server/` and requires server runtime plus a server-side API key; local dev uses a server-side simulated provider fetch without exposing credentials to the browser.
- API parity states are enforced from `docs/api-coverage.md`, `src/api/coverage.ts`, and `src/api/actionCatalog.ts`.
