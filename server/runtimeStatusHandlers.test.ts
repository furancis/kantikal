import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createRuntimeStatusHandlers } from './runtimeStatusHandlers'

const tempRoots: string[] = []

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
})

async function makeModelRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'suno-runtime-models-'))
  tempRoots.push(root)
  return root
}
