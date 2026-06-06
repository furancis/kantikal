export type RuntimeState = 'online' | 'configured' | 'offline' | 'blocked'

export type RuntimeStatus = {
  provider: {
    state: RuntimeState
    providerMode: 'live' | 'local'
    productOrigin: string
    apiBaseUrl: string
    apiV1BaseUrl: string
    uploadBaseUrl: string
    credential: 'present' | 'missing'
    message: string
    callbackUrl?: string
  }
  comfy: {
    state: RuntimeState
    baseUrl: string
    version?: string
    device?: string
    vramFreeMb?: number
    modelRoot: string
    modelCount: number
    models: string[]
    message: string
  }
}

export type RuntimeStatusClient = {
  load(): Promise<RuntimeStatus>
}

export type FetchRuntimeStatusClientInput = {
  baseUrl?: string
  fetchImpl?: typeof fetch
  fallback?: RuntimeStatusClient
}

export function createFetchRuntimeStatusClient(input: FetchRuntimeStatusClientInput = {}): RuntimeStatusClient {
  const fetchImpl = input.fetchImpl ?? fetch
  const fallback = input.fallback ?? createLocalRuntimeStatusClient()

  return {
    async load() {
      let response: Response
      try {
        response = await fetchImpl(runtimeStatusRoute(input.baseUrl), {
          headers: { Accept: 'application/json' },
        })
      } catch {
        return fallback.load()
      }

      if (response.status === 404) {
        return fallback.load()
      }

      if (!response.ok) {
        throw new Error(`Runtime status route failed with HTTP ${response.status}`)
      }

      const payload = (await response.json()) as { status?: RuntimeStatus }
      if (!payload.status) {
        throw new Error('Runtime status route returned no status payload')
      }
      return payload.status
    },
  }
}

export function createLocalRuntimeStatusClient(): RuntimeStatusClient {
  return {
    async load() {
      return {
        provider: {
          state: 'blocked',
          providerMode: 'local',
          productOrigin: 'https://provider.com',
          apiBaseUrl: 'https://api.providerapi.org',
          apiV1BaseUrl: 'https://api.providerapi.org/api/v1',
          uploadBaseUrl: 'https://providerapiorg.redpandaai.co',
          credential: 'missing',
          message:
            'Printing Press / logged-in provider web is the primary lane; optional compatible-provider adapter proof has not run.',
        },
        comfy: {
          state: 'offline',
          baseUrl: 'http://127.0.0.1:8188',
          modelRoot: 'D:\\Dev\\ComfyUI\\ComfyUI\\models',
          modelCount: 0,
          models: [],
          message: 'Local ComfyUI runtime status route is unavailable.',
        },
      }
    },
  }
}

function runtimeStatusRoute(baseUrl: string | undefined): string {
  return `${(baseUrl ?? '').replace(/\/$/, '')}/api/runtime/status`
}
