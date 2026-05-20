# T180 UI and Runtime Plan

## Goal

Make Suno Visual Studio feel and work like a full native visual music-generation product:

`brief -> lyrics/style/voice -> Suno generation -> compare versions -> select track -> Song Lab edits/stems -> exports -> optional MV/lipsync -> release pack`

This is a product-shape task first, then a runtime integration task. The next implementation should not add more exposed machinery unless it makes the golden flow clearer.

## Verified Current Inputs

- Repo branch: `feature/visual-studio-t170`
- Git state before planning: clean
- Active board before planning: `T170`
- Suno app origin seen in local Chrome history: `https://suno.com`
- Suno-compatible API base currently used by repo/docs: `https://api.sunoapi.org`
- API v1 prefix: `https://api.sunoapi.org/api/v1`
- File upload base from current docs ledger: `https://sunoapiorg.redpandaai.co`
- ComfyUI install: `D:\Dev\ComfyUI`
- ComfyUI launch command: `D:\Dev\ComfyUI\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --enable-manager --listen 127.0.0.1 --port 8188`
- ComfyUI status during planning: installed but not listening on `127.0.0.1:8188`
- Local video-capable models found:
  - `checkpoints\ltx-2.3-22b-dev-fp8.safetensors`
  - `diffusion_models\wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors`
  - `diffusion_models\wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors`
  - `loras\Wan2.2-Lightning_I2V-A14B-4steps-lora_HIGH_fp16.safetensors`
  - `loras\Wan2.2-Lightning_I2V-A14B-4steps-lora_LOW_fp16.safetensors`
  - `upscale_models\RealESRGAN_x4plus.safetensors`

## UI Options

### Option A: Track-First Studio

First screen is the active song/project. The selected track is the center of gravity. Prompt, lyrics, style, voice, versions, and exports orbit that selected track.

Use this for the main product.

### Option B: Workflow Canvas

Google Stitch-style graph:

`Brief -> Prompt -> Generate -> Compare -> Edit/Stems -> Export -> MV`

Each node has status, blocker, next action, and receipts.

Use this as the state map under the track-first top surface.

### Option C: Producer Timeline

Song sections, stems, edit ranges, captions, scenes, and lipsync repair ranges live on one timeline.

Use this inside Song Lab and Music Video Lane, not as the whole app shell.

## Recommended Direction

Build an A+B hybrid:

- Track-first hero/control room.
- Workflow canvas as the visible state map.
- Inspector panel for selected node details.
- Bottom strip for generation versions and waveforms.
- Music Video Lane as a child of selected track.
- ComfyUI and provider details hidden behind runtime drawers, not the first visible product.

## Design Prompt

```text
Design a high-end visual web app called Suno Visual Studio.

It is not a chat app, not a CLI, not a generic dashboard. It should feel like Google Stitch or Claude Design for music creation: a dynamic visual studio where the user moves from song idea to finished release.

Core flow:
Brief -> lyrics/style/voice -> Suno generation batch -> compare versions -> select track -> Song Lab edits/stems -> exports -> optional music video lane -> lipsync QA -> release pack.

Layout:
- Full-screen app, dark but not generic slate/purple.
- First viewport shows the active song/project as the center of gravity.
- Left rail: project, brief, lyrics, style, voice.
- Center: visual workflow canvas with connected cards and live state.
- Right inspector: selected node details, provider/API status, errors, next action.
- Bottom: generation/version timeline with audio cards and waveform strips.
- Music video lane is subordinate to selected track, with scene cards, ComfyUI render status, lipsync evidence, and repair ranges.

UX requirements:
- Always show the next best action.
- Make blocked states explicit and useful.
- Hide debug/API details unless inspecting.
- Use dense professional controls, not marketing cards.
- Include empty, loading, error, and success states.
- Make it look shippable, expensive, and creator-native.
```

## Implementation Plan

1. Product shell
   - Replace the current busy dashboard feel with a track-first command room.
   - Add a single dominant next-action path.
   - Collapse API/debug surfaces into inspector drawers.

2. Golden Suno flow
   - Guide prompt/lyrics/style/voice setup.
   - Generate batch.
   - Compare and select one source track.
   - Expose Song Lab edits/stems from selected track only.
   - Export audio/stems/metadata from selected track.

3. Runtime configuration
   - Add explicit server runtime config for the optional Suno-compatible provider base, upload base, callback URL, and credential presence.
   - Add explicit ComfyUI runtime config for URL, health, queue, model inventory, and selected video workflow.
   - Show runtime health in a compact status rail.

4. ComfyUI worker boundary
   - Mount a local ComfyUI client against `http://127.0.0.1:8188`.
   - Read `/system_stats` and `/object_info`.
   - Queue a minimal smoke workflow only after health and model inventory pass.
   - Keep MV subordinate to selected track.

5. Native QA
   - Use Playwright for golden path and reload persistence.
   - Use browser visual checks for first viewport, no overlap, and mobile/desktop fit.
   - Use design review before PR.
   - Use CI, credential scan, wording scan, and Greptile on PR.

## Acceptance Criteria

- First screen is intuitive without reading docs.
- User can see the full Suno flow in one coherent visual system.
- One primary next action is visible at each state.
- MV is clearly a subfeature of selected track.
- Provider/API failures are visible and recoverable.
- ComfyUI health/model inventory is visible when local runtime is available.
- Local QA proves golden path, reload, blocked states, and visual fit.
- PR has hosted CI and Greptile pass.

## Not Complete Until

- Live Suno credential path is either proven or explicitly blocked by missing credential.
- Local ComfyUI worker path is proven against the installed runtime.
- The app is visually reviewed in-browser after implementation.
- The final judge/CEO review agrees the product shape is no longer disappointing or unintuitive.
