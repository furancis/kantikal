# The Kantikal Claude Design Pack

Start with `01_PASTE_INTO_CLAUDE_DESIGN.md`.

Goal: give Claude Design enough context to finalize The Kantikal UI/UX without Issa re-explaining the product.

Product-facing name: **The Kantikal**.

Parent/band context: **sealf'salve**.

Internal repo name: `suno-visual-studio`.

Use Liquid DOM as the primary interaction/material system. It is not optional visual inspiration.

## How To Use

1. Paste `01_PASTE_INTO_CLAUDE_DESIGN.md` into Claude Design.
2. Attach or reference the supporting docs if needed:
   - `02_BUILD_PLAN.md`
   - `03_DESIGN_SYSTEM.md`
   - `04_UX_MODEL.md`
   - `05_TASTE_SYSTEM.md`
   - `06_LIQUID_DOM_REFERENCE.md`
   - `07_CODEBASE_MAP.md`
   - `08_IMPLEMENTATION_CONTRACT.md`
   - `09_ASSET_DELIVERABLE_INVENTORY.md`
3. Ask Claude Design for the final UI/UX deliverables in the requested format.
4. Feed the result back to Codex for implementation.

## Non-Negotiables

- The Kantikal is not SaaS.
- It is not a Suno wrapper.
- It is not a generic dashboard.
- Lyrics are the master object.
- DB-first implementation.
- Liquid DOM is the primary material system; fallback exists only as a runtime/review guard.
- Liquid DOM must not reduce lyric readability or become decorative glass noise.
