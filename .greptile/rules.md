# Greptile Rules: Suno Visual Studio

## Full Shape

The product is a visual workflow app for Suno music generation. Preserve the complete chain: idea, prompt, lyrics, style, voice/persona, generation batches, comparison, Song Lab, stems, library, cleanup, music-video lane, lipsync QA, and release pack.

## Music Video Boundary

The music-video lane is a subfeature. It starts from a selected song/version and must preserve the chosen audio unless the user explicitly branches it.

## API Parity

Full API coverage is a product requirement. If a Suno/provider capability exists, it needs a UI mapping, backend mapping, planned state, or explicit unsupported record.

## Perfect Lipsync

Approximate lipsync is failure. Video export must be blocked until phoneme, frame, mouth-shape, segment drift, and post-stitch checks pass.

## Cleanup

Destructive cleanup needs archive-first behavior, undo where possible, and receipts.

## Secrets

No provider key belongs in client code or repo docs.
