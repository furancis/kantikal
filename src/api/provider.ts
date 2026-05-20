import type { GenerationBatch } from '../domain/workflow'
import { providerActionDefinitionByAction } from './actionCatalog'
import type { ProviderActionDefinition } from './actionCatalog'

export type ProviderRuntimeConfigInput = {
  runtime: 'server' | 'client'
  apiKey?: string
  baseUrl?: string
}

export type ProviderRuntimeConfig = {
  runtime: 'server'
  provider: 'suno-compatible'
  baseUrl: string
  hasApiKey: boolean
  credentialMode: 'server-env' | 'server-injected' | 'missing'
}

export type PublicProviderStatus = {
  provider: 'suno-compatible'
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
  receiptId: string
}

export type SunoProvider = {
  generateBatch(request: GenerateBatchRequest): Promise<GenerationBatch>
  executeAction?(request: ExecuteProviderActionRequest): Promise<ProviderActionResult>
}

export function createProviderRuntimeConfig(
  input: ProviderRuntimeConfigInput,
): ProviderRuntimeConfig {
  if (input.runtime !== 'server') {
    throw new Error('Provider credentials must remain server-side')
  }

  return {
    runtime: 'server',
    provider: 'suno-compatible',
    baseUrl: input.baseUrl ?? 'https://api.sunoapi.org',
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

export function createMockSunoProvider(): SunoProvider {
  const provider: SunoProvider = {
    async generateBatch(request) {
      if (request.count < 1) {
        throw new Error('Mock Suno provider requires at least one track')
      }

      return {
        providerJobId: `mock_suno_${slugify(request.brief)}`,
        tracks: Array.from({ length: request.count }, (_, index) => ({
          id: `mock-track-${index + 1}`,
          title: `${request.brief} v${index + 1}`,
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
          message: `${request.capability} is not exposed by the current Suno-compatible provider docs.`,
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
          outcome: 'blocked',
          message: `${request.capability} is an inbound server handler and cannot be dispatched to the external provider.`,
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
        outcome: 'planned',
        message: `${request.capability} is mapped to a server provider action and waits for the server adapter lane.`,
        authBoundary: definition.authBoundary,
        endpoint: definition.path,
      })
    },
  }

  return provider
}

export async function executeProviderAction(
  provider: SunoProvider,
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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
