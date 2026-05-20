# Suno Visual Studio

Dynamic visual app for the whole Suno music generation workflow.

Core shape:

`brief -> prompt/lyrics/style/voice -> Suno batches -> compare/rate/version -> Song Lab edits/stems -> optional Music Video Lane -> release pack`

Non-negotiables:

- Visual app first.
- Full Suno/provider API coverage.
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
```
