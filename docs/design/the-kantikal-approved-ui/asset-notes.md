# Asset Notes

This is a private studio app for one creator. There is no marketing asset
program. What follows is the provenance contract for everything that ends
up on disk.

## Type & icon assets

| Asset | Source | License |
|---|---|---|
| Fraunces | Google Fonts (Undercase Type) | OFL — bundled or self-hosted, fine to ship |
| IBM Plex Mono | Google Fonts (IBM) | OFL |
| Source Sans 3 | Google Fonts (Adobe) | OFL |
| Cabinet Grotesk | Fontshare (Indian Type Foundry) | Fontshare license — free for commercial use, must self-host |
| Icons | Hand-authored inline SVG in `lib/icons.jsx` | original to this project |

Self-host all four font families in production. Don't rely on Google
Fonts CDN at runtime — bake them into the build. See `src/fonts/` after
porting.

## Audio assets

The app's job is to MAKE audio, not bundle it. Two categories exist on disk:

1. **References** — user-provided. Each carries `source_url`, `uploaded_at`,
   `provenance_label` (`manual upload` / `referenced URL` / `imported from
   provider`). The UI shows these labels on the reference card on demand.

2. **Generated takes** — output of `runs.submit()`. Linked to a
   `GenerationReceipt` with the exact brief that produced them. Never
   shipped publicly without that receipt being accessible (Release Pack
   bundles the receipt JSON alongside the audio).

No reference audio is bundled with the app. If a demo is needed for screenshots,
mark it `demo · placeholder` in the UI.

## Image assets (cover, MV)

- **Cover art** — uploaded by the user. The Release Pack screen shows a
  placeholder with monospace `[cover art placeholder · drop image to replace]`
  copy until a real image lands.
- **MV variants** — only exist when the user produces them through the MV
  pipeline (out of scope here). The MV tab does not render until at least
  one variant exists with a receipt attached.

No stock photography. No generic gradients. No AI-generated cover unless the
user explicitly asks and then we tag it `generated` with the generation
receipt.

## Lyric content

`Almost Love (v3.4 draft)` is the demo lyric. It's the user's own writing,
attributed to **sealf'salve**, used as a fixture for the design.

In production:
- Lyrics are first-class DB rows, never JSON files in the build.
- A `dev/fixtures/` folder holds onboarding templates with placeholder
  text marked `[ template ]`.
- Lyrics are never sent to telemetry. The taste system records signals
  with IDs, not lyric strings.

## Voice / reference person assets

Voice characterizations (`close · controlled fem`, `cracked tenor`, etc.) are
user-defined labels. They are NOT recognizable likenesses of real people
unless the user explicitly imports such a reference (and accepts the
provenance label).

## Brand assets (sealf'salve)

The mark used in the top-left is a generic cross-hatch glyph. When the band
provides its own wordmark / sigil, it replaces the inline SVG in
`lib/chrome.jsx` → `Brand`.

## Bundling

- All fonts are self-hosted under `src/fonts/`.
- The reference orb shader code (in `uploads/realtime-ai-shader-inspection.zip`)
  is **inspection material only** — none of it is bundled. Our `LyricFabric`
  is an independent implementation in `lib/fabric.jsx`.
- `@liquid-dom/*` packages ship from the repo's npm install. No CDN at
  runtime.

## Receipts

Every action that touches a provider, every export, every import — produces
a receipt. Receipts live in the DB AND are exportable as JSON in the Release
Pack. Receipts are the only assets that can be considered "evidence" of
how a track came to be.

