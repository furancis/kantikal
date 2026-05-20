import { existsSync, type Dirent } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { RuntimeStatus, RuntimeState } from '../src/api/runtimeStatus'

export type RuntimeStatusHandlersInput = {
  fetchImpl?: typeof fetch
  env?: NodeJS.ProcessEnv
  readDir?: ReadDirWithTypes
}

type ComfySystemStats = {
  system?: {
    comfyui_version?: string
  }
  devices?: Array<{
    name?: string
    vram_free?: number
  }>
}

type ReadDirWithTypes = (current: string, options: { withFileTypes: true }) => Promise<Dirent[]>

const defaultComfyBaseUrl = 'http://127.0.0.1:8188'
const defaultModelRoot = 'D:\\Dev\\ComfyUI\\ComfyUI\\models'
const modelExtensions = new Set(['.safetensors', '.ckpt', '.pth', '.pt', '.gguf'])

export function createRuntimeStatusHandlers(input: RuntimeStatusHandlersInput = {}) {
  const fetchImpl = input.fetchImpl ?? fetch
  const env = input.env ?? process.env
  const readDir = input.readDir ?? readdir

  return {
    async getStatus(): Promise<RuntimeStatus> {
      const apiBaseUrl = env.SUNO_API_BASE_URL ?? 'https://api.sunoapi.org'
      const apiV1BaseUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/v1`
      const uploadBaseUrl = env.SUNO_UPLOAD_BASE_URL ?? 'https://sunoapiorg.redpandaai.co'
      const comfyBaseUrl = env.COMFYUI_BASE_URL ?? defaultComfyBaseUrl
      const modelRoot = env.COMFYUI_MODEL_ROOT ?? defaultModelRoot
      const models = await listModelFiles(modelRoot, readDir)
      const comfy = await probeComfy(fetchImpl, comfyBaseUrl, modelRoot, models)

      return {
        suno: {
          state: env.SUNO_API_KEY ? 'online' : 'blocked',
          productOrigin: 'https://suno.com',
          apiBaseUrl,
          apiV1BaseUrl,
          uploadBaseUrl,
          credential: env.SUNO_API_KEY ? 'present' : 'missing',
          callbackUrl: env.SUNO_CALLBACK_URL,
        },
        comfy,
      }
    },
  }
}

async function probeComfy(
  fetchImpl: typeof fetch,
  comfyBaseUrl: string,
  modelRoot: string,
  models: string[],
): Promise<RuntimeStatus['comfy']> {
  try {
    const response = await fetchImpl(`${comfyBaseUrl.replace(/\/$/, '')}/system_stats`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) {
      return comfyStatus('blocked', comfyBaseUrl, modelRoot, models, `ComfyUI returned HTTP ${response.status}`)
    }

    const stats = (await response.json()) as ComfySystemStats
    const device = stats.devices?.[0]
    return {
      state: 'online',
      baseUrl: comfyBaseUrl,
      version: stats.system?.comfyui_version,
      device: device?.name,
      vramFreeMb: device?.vram_free ? Math.round(device.vram_free / 1024 / 1024) : undefined,
      modelRoot,
      modelCount: models.length,
      models,
      message: 'ComfyUI runtime ready.',
    }
  } catch {
    return comfyStatus('offline', comfyBaseUrl, modelRoot, models, 'ComfyUI is installed but not listening.')
  }
}

function comfyStatus(
  state: RuntimeState,
  baseUrl: string,
  modelRoot: string,
  models: string[],
  message: string,
): RuntimeStatus['comfy'] {
  return {
    state,
    baseUrl,
    modelRoot,
    modelCount: models.length,
    models,
    message,
  }
}

async function listModelFiles(modelRoot: string, readDir: ReadDirWithTypes): Promise<string[]> {
  if (!existsSync(modelRoot)) {
    return []
  }

  const files: string[] = []
  await collectModelFiles(modelRoot, modelRoot, files, readDir)
  return files.sort().slice(0, 24)
}

async function collectModelFiles(
  root: string,
  current: string,
  output: string[],
  readDir: ReadDirWithTypes,
): Promise<void> {
  let entries: Dirent[]
  try {
    entries = await readDir(current, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(current, entry.name)
    if (entry.isDirectory()) {
      await collectModelFiles(root, fullPath, output, readDir)
      continue
    }
    if (modelExtensions.has(path.extname(entry.name).toLowerCase())) {
      output.push(path.relative(root, fullPath).split(path.sep).join('/'))
    }
  }
}
