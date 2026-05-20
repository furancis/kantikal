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
const sunoProviderModes = new Set(['live', 'local'])

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
      const providerMode = sunoProviderMode(env.SUNO_PROVIDER_MODE, env.SUNO_API_KEY)
      const models = await listModelFiles(modelRoot, readDir)
      const suno = await probeSuno(fetchImpl, {
        apiBaseUrl,
        apiV1BaseUrl,
        uploadBaseUrl,
        providerMode,
        apiKey: env.SUNO_API_KEY,
        callbackUrl: env.SUNO_CALLBACK_URL,
      })
      const comfy = await probeComfy(fetchImpl, comfyBaseUrl, modelRoot, models)

      return {
        suno,
        comfy,
      }
    },
  }
}

type SunoProbeInput = {
  apiBaseUrl: string
  apiV1BaseUrl: string
  uploadBaseUrl: string
  providerMode: 'live' | 'local'
  apiKey?: string
  callbackUrl?: string
}

async function probeSuno(fetchImpl: typeof fetch, input: SunoProbeInput): Promise<RuntimeStatus['suno']> {
  const base = {
    providerMode: input.providerMode,
    productOrigin: 'https://suno.com',
    apiBaseUrl: input.apiBaseUrl,
    apiV1BaseUrl: input.apiV1BaseUrl,
    uploadBaseUrl: input.uploadBaseUrl,
    credential: input.apiKey ? ('present' as const) : ('missing' as const),
    callbackUrl: input.callbackUrl,
  }

  if (input.providerMode === 'local') {
    return {
      ...base,
      state: input.apiKey ? 'configured' : 'blocked',
      message: input.apiKey
        ? 'Server-side Suno key is configured, but the local QA provider is active.'
        : 'Local QA provider is active; set SUNO_API_KEY with SUNO_PROVIDER_MODE=live for real provider dispatch.',
    }
  }

  if (!input.apiKey) {
    return {
      ...base,
      state: 'blocked',
      message: 'Live provider mode needs SUNO_API_KEY before dispatch.',
    }
  }

  try {
    const response = await fetchImpl(`${input.apiV1BaseUrl}/generate/credit`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    const providerBody = await readJsonResponse(response)
    const providerCode = numericCode(providerBody)

    if (response.ok && (providerCode === undefined || providerCode === 200)) {
      return {
        ...base,
        state: 'online',
        message: 'Suno API credential accepted by the remaining-credits endpoint.',
      }
    }

    const rejected = response.status === 401 || response.status === 403 || providerCode === 401 || providerCode === 403
    return {
      ...base,
      state: rejected ? 'blocked' : 'configured',
      message: providerCode
        ? `Suno API remaining-credits probe returned HTTP ${response.status} with provider code ${providerCode}.`
        : `Suno API remaining-credits probe returned HTTP ${response.status}.`,
    }
  } catch {
    return {
      ...base,
      state: 'configured',
      message: 'Suno API key is configured, but the live remaining-credits probe did not complete.',
    }
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
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

function sunoProviderMode(value: string | undefined, apiKey: string | undefined): 'live' | 'local' {
  if (value && sunoProviderModes.has(value)) {
    return value as 'live' | 'local'
  }
  return apiKey ? 'live' : 'local'
}

function numericCode(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }
  const code = (value as Record<string, unknown>).code
  return typeof code === 'number' ? code : undefined
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
