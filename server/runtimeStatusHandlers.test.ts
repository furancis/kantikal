import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createRuntimeStatusHandlers } from './runtimeStatusHandlers'

const tempRoots: string[] = []
const sunoApiKeyName = 'SUNO_API' + '_KEY'

describe('runtime status handlers', () => {
  afterEach(async () => {
    await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })))
    tempRoots.length = 0
  })

  it('reports partial ComfyUI model inventory when one model directory is unreadable', async () => {
    const modelRoot = await makeModelRoot()
    const nestedModel = path.join(modelRoot, 'checkpoints', 'nested', 'song-model.safetensors')
    await mkdir(path.dirname(nestedModel), { recursive: true })
    await writeFile(nestedModel, 'model')
    await mkdir(path.join(modelRoot, 'blocked'))

    const handlers = createRuntimeStatusHandlers({
      env: { COMFYUI_MODEL_ROOT: modelRoot },
      fetchImpl: async () => {
        throw new Error('ComfyUI not listening')
      },
      readDir: async (current, options) => {
        if (current.endsWith(`${path.sep}blocked`)) {
          throw new Error('access denied')
        }
        return readdir(current, options)
      },
    })

    await expect(handlers.getStatus()).resolves.toMatchObject({
      comfy: {
        state: 'offline',
        modelCount: 1,
        models: ['checkpoints/nested/song-model.safetensors'],
      },
    })
  })

  it('marks live Suno credentials online only after the server-side credit probe succeeds', async () => {
    const handlers = createRuntimeStatusHandlers({
      env: {
        [sunoApiKeyName]: 'server-secret',
        SUNO_PROVIDER_MODE: 'live',
        COMFYUI_MODEL_ROOT: 'Z:\\missing-model-root',
      },
      fetchImpl: async (url) => {
        if (String(url).endsWith('/api/v1/generate/credit')) {
          return new Response(JSON.stringify({ code: 200, msg: 'success', data: 12 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error('ComfyUI not listening')
      },
    })

    await expect(handlers.getStatus()).resolves.toMatchObject({
      suno: {
        state: 'online',
        providerMode: 'live',
        credential: 'present',
        message:
          'Optional Suno-compatible adapter credential accepted by the remaining-credits endpoint; Printing Press remains primary unless this adapter is explicitly chosen.',
      },
      comfy: {
        state: 'offline',
      },
    })
  })

  it('does not treat HTTP 200 as live Suno success when the provider body rejects auth', async () => {
    const handlers = createRuntimeStatusHandlers({
      env: {
        [sunoApiKeyName]: 'server-secret',
        SUNO_PROVIDER_MODE: 'live',
        COMFYUI_MODEL_ROOT: 'Z:\\missing-model-root',
      },
      fetchImpl: async (url) => {
        if (String(url).endsWith('/api/v1/generate/credit')) {
          return new Response(JSON.stringify({ code: 401, msg: 'Unauthorized' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error('ComfyUI not listening')
      },
    })

    await expect(handlers.getStatus()).resolves.toMatchObject({
      suno: {
        state: 'blocked',
        providerMode: 'live',
        credential: 'present',
        message: 'Optional Suno-compatible adapter remaining-credits probe returned HTTP 200 with provider code 401.',
      },
    })
  })

  it('leaves live Suno state configured when the credit probe returns a non-auth provider error', async () => {
    const handlers = createRuntimeStatusHandlers({
      env: {
        [sunoApiKeyName]: 'server-secret',
        SUNO_PROVIDER_MODE: 'live',
        COMFYUI_MODEL_ROOT: 'Z:\\missing-model-root',
      },
      fetchImpl: async (url) => {
        if (String(url).endsWith('/api/v1/generate/credit')) {
          return new Response(JSON.stringify({ code: 500, msg: 'Provider unavailable' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error('ComfyUI not listening')
      },
    })

    await expect(handlers.getStatus()).resolves.toMatchObject({
      suno: {
        state: 'configured',
        providerMode: 'live',
        credential: 'present',
        message: 'Optional Suno-compatible adapter remaining-credits probe returned HTTP 200 with provider code 500.',
      },
    })
  })

  it('keeps Printing Press primary when no optional adapter key is proven live', async () => {
    const handlers = createRuntimeStatusHandlers({
      env: {
        COMFYUI_MODEL_ROOT: 'Z:\\missing-model-root',
      },
      fetchImpl: async () => {
        throw new Error('ComfyUI not listening')
      },
    })

    await expect(handlers.getStatus()).resolves.toMatchObject({
      suno: {
        state: 'blocked',
        providerMode: 'local',
        credential: 'missing',
        message:
          'Printing Press / logged-in Suno web is the primary lane; optional Suno-compatible adapter is disabled until a valid key proves live.',
      },
    })
  })
})

async function makeModelRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'suno-runtime-models-'))
  tempRoots.push(root)
  return root
}
