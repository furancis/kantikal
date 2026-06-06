import type { GenerationBatch } from '../domain/workflow'
import { providerActionDefinitionByAction } from './actionCatalog'
import type { ProviderActionDefinition } from './actionCatalog'

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type ProviderRuntimeConfigInput = {
  runtime: 'server' | 'client'
  apiKey?: string
  baseUrl?: string
}

export type ProviderRuntimeConfig = {
  runtime: 'server'
  provider: 'compatible-provider'
  baseUrl: string
  hasApiKey: boolean
  credentialMode: 'server-env' | 'server-injected' | 'missing'
}

export type PublicProviderStatus = {
  provider: 'compatible-provider'
  baseUrl: string
  hasApiKey: boolean
  credentialMode: ProviderRuntimeConfig['credentialMode']
}

export type GenerateBatchRequest = {
  brief: string
  lyrics: string
  style: string
  voice: string
  count: number
}

export type ExecuteProviderActionRequest = {
  action: string
  capability: string
  payload?: Record<string, unknown>
  brief?: string
  lyrics?: string
  style?: string
  voice?: string
}

export type ProviderActionOutcome = 'succeeded' | 'planned' | 'blocked' | 'unsupported'

export type ProviderActionResult = {
  action: string
  capability: string
  outcome: ProviderActionOutcome
  message: string
  authBoundary: ProviderActionDefinition['authBoundary']
  endpoint?: string
  providerTaskId?: string
  providerResourceUrl?: string
  receiptId: string
}

export type MusicProvider = {
  generateBatch(request: GenerateBatchRequest): Promise<GenerationBatch>
  executeAction?(request: ExecuteProviderActionRequest): Promise<ProviderActionResult>
}

export type FetchMusicProviderInput = {
  baseUrl?: string
  fetchImpl?: FetchLike
  fallback?: MusicProvider
}

export function createProviderRuntimeConfig(
  input: ProviderRuntimeConfigInput,
): ProviderRuntimeConfig {
  if (input.runtime !== 'server') {
    throw new Error('Provider credentials must remain server-side')
  }

  return {
    runtime: 'server',
    provider: 'compatible-provider',
    baseUrl: input.baseUrl ?? 'https://api.providerapi.org',
    hasApiKey: Boolean(input.apiKey),
    credentialMode: input.apiKey ? 'server-injected' : 'missing',
  }
}

export function publicProviderStatus(config: ProviderRuntimeConfig): PublicProviderStatus {
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    hasApiKey: config.hasApiKey,
    credentialMode: config.credentialMode,
  }
}

export function createFetchMusicProvider(input: FetchMusicProviderInput = {}): MusicProvider {
  const fetchImpl = input.fetchImpl ?? fetch
  const fallback = input.fallback ?? createMockMusicProvider()

  async function fetchRoute<T>(
    path: string,
    init: RequestInit,
    valueName: string,
    fallbackAction: () => Promise<T>,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetchImpl(providerRoute(input.baseUrl, path), init)
    } catch (error) {
      throw new Error(`Provider route unavailable for ${valueName}: ${errorMessage(error)}`, { cause: error })
    }

    if (response.status === 404) {
      return fallbackAction()
    }

    const payload = await readProviderRoutePayload(response)
    if (!response.ok) {
      throw new Error(stringFrom(payload.error) ?? `Provider route failed with HTTP ${response.status}`)
    }

    const value = payload[valueName]
    if (value === undefined) {
      throw new Error(`Provider route returned no ${valueName}`)
    }
    return value as T
  }

  return {
    generateBatch(request) {
      return fetchRoute(
        'generate-batch',
        jsonRequest({ request }),
        'batch',
        () => fallback.generateBatch(request),
      )
    },

    executeAction(request) {
      return fetchRoute(
        'actions',
        jsonRequest({ request }),
        'result',
        () => executeProviderAction(fallback, request),
      )
    },
  }
}

export function createMockMusicProvider(): MusicProvider {
  const provider: MusicProvider = {
    async generateBatch(request) {
      if (request.count < 1) {
        throw new Error('Mock music provider requires at least one track')
      }

      return {
        providerJobId: `mock_music_${slugify(request.brief)}`,
        tracks: Array.from({ length: request.count }, (_, index) => ({
          id: `mock-track-${index + 1}`,
          title: `${displayBriefTitle(request.brief)} v${index + 1}`,
          durationSeconds: 150 + index * 4,
        })),
      }
    },

    async executeAction(request) {
      const definition = providerActionDefinitionByAction(request.action)
      if (!definition) {
        return providerResult(request, {
          outcome: 'unsupported',
          message: `${request.capability} has no provider action mapping.`,
          authBoundary: 'server',
        })
      }

      if (definition.execution === 'mock-live' && request.action === 'generateBatch') {
        const batch = await provider.generateBatch({
          brief: request.brief ?? 'API parity mock action',
          lyrics: request.lyrics ?? '',
          style: request.style ?? '',
          voice: request.voice ?? '',
          count: 2,
        })
        return providerResult(request, {
          outcome: 'succeeded',
          message: `${request.capability} succeeded through the mocked provider lane.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
          providerTaskId: batch.providerJobId,
        })
      }

      if (definition.execution === 'unsupported') {
        return providerResult(request, {
          outcome: 'unsupported',
          message: `${request.capability} is not exposed by the current compatible-provider provider docs.`,
          authBoundary: definition.authBoundary,
        })
      }

      if (definition.execution === 'external-worker') {
        return providerResult(request, {
          outcome: 'blocked',
          message: `${request.capability} requires an external worker lane before it can run.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'inbound-handler') {
        return providerResult(request, {
          outcome: 'succeeded',
          message: `${request.capability} is implemented as an inbound server handler and cannot be dispatched to the external provider.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'server-parameter') {
        return providerResult(request, {
          outcome: 'succeeded',
          message: `${request.capability} is implemented as a request parameter on an existing provider endpoint.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'local-only') {
        return providerResult(request, {
          outcome: 'succeeded',
          message: `${request.capability} is available as a local workflow action.`,
          authBoundary: definition.authBoundary,
        })
      }

      return providerResult(request, {
        outcome: 'blocked',
        message: `${request.capability} needs the server provider route before it can dispatch with server-only credentials.`,
        authBoundary: definition.authBoundary,
        endpoint: definition.path,
      })
    },
  }

  return provider
}

export async function executeProviderAction(
  provider: MusicProvider,
  request: ExecuteProviderActionRequest,
): Promise<ProviderActionResult> {
  if (provider.executeAction) {
    return provider.executeAction(request)
  }

  return providerResult(request, {
    outcome: 'blocked',
    message: `${request.capability} needs a provider action dispatcher.`,
    authBoundary: 'server',
  })
}

function providerRoute(baseUrl: string | undefined, path: string): string {
  return `${(baseUrl ?? '').replace(/\/$/, '')}/api/provider/${path}`
}

function displayBriefTitle(brief: string): string {
  return brief.split('\n')[0]?.trim() || 'Untitled track'
}

function jsonRequest(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function readProviderRoutePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) {
    return {}
  }

  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'fetch failed'
}

function providerResult(
  request: ExecuteProviderActionRequest,
  result: Omit<ProviderActionResult, 'action' | 'capability' | 'receiptId'>,
): ProviderActionResult {
  return {
    action: request.action,
    capability: request.capability,
    receiptId: `provider-action-${slugify(`${request.capability}-${request.action}`)}`,
    ...result,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
