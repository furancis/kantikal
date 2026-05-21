# Liquid DOM Primary Material System For The Kantikal

Source: https://github.com/AndrewPrifer/liquid-dom

Liquid DOM is a WebGPU liquid-glass rendering monorepo with React bindings, Three.js integration, React Three Fiber integration, and a renderer-agnostic layout engine.

Use it as the primary material system for:

- liquid-glass command surfaces
- ritual instrument feel
- tactile hover/press states
- inspector overlays
- Remix Picker layers
- TasteSignal chips
- branch/lineage overlays
- generation confirmation layers

Do not use it as:

- a generic frosted-card skin
- decorative glass on every panel
- a replacement for clear lyric readability
- a reason to make the app feel like SaaS or Apple-demo UI

## Relevant Packages

- `@liquid-dom/react`: installed primary package for this React app. Provides React bindings and `LiquidCanvas`.
- `@liquid-dom/core`: lower-level WebGPU renderer and scene graph.
- `@liquid-dom/layout`: renderer-independent layout engine.
- `@liquid-dom/three` and `@liquid-dom/r3f`: only relevant if the app adopts a Three/WebGPU scene.

## Runtime Constraints

- Liquid-glass rendering requires WebGPU.
- DOM-backed `Html` content additionally depends on Chrome's experimental Canvas Draw Element flag.
- Three integrations require Three's WebGPU renderer, not WebGLRenderer.

## Implementation Rule

Liquid DOM is the default implementation target for The Kantikal UI. The dependency is installed in this repo.

Fallback is allowed only as a runtime/review guard when the browser cannot provide WebGPU or Canvas Draw Element. Do not convert fallback into the design language.

Required proof before claiming it works:

- package install succeeds
- TypeScript build passes
- browser reports `navigator.gpu`
- canvas renders nonblank
- runtime/review guard works without WebGPU
- lyric text remains readable

## Design Direction

The Kantikal should feel like opening a private songbook and lyrical-musical machine. Liquid DOM should make controls feel like instruments around the text.

The lyric document remains stable, readable, and central. Liquid glass belongs around it, not on top of it.
