import { providerActionDefinitionByAction } from '../src/api/actionCatalog'
import type {
  ExecuteProviderActionRequest,
  ProviderActionResult,
  ProviderRuntimeConfigInput,
} from '../src/api/provider'

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type SunoApiServerAdapterInput = ProviderRuntimeConfigInput & {
  fetchImpl?: FetchLike
}

export type SunoApiServerAdapter = {
  executeProviderAction(request: ExecuteProviderActionRequest): Promise<ProviderActionResult>
}

export function createSunoApiServerAdapter(input: SunoApiServerAdapterInput): SunoApiServerAdapter {
  if (input.runtime !== 'server') {
    throw new Error('Suno API credentials must stay server-side')
  }

  const baseUrl = input.baseUrl ?? 'https://api.sunoapi.org'
  const fetchImpl = input.fetchImpl ?? fetch

  return {
    async executeProviderAction(request) {
      const definition = providerActionDefinitionByAction(request.action)
      if (!definition) {
        return resultFor(request, {
          outcome: 'unsupported',
          message: `${request.capability} has no server action definition.`,
          authBoundary: 'server',
        })
      }

      if (definition.execution === 'unsupported') {
        return resultFor(request, {
          outcome: 'unsupported',
          message: `${request.capability} is not available in the current Suno-compatible provider docs.`,
          authBoundary: definition.authBoundary,
        })
      }

      if (definition.execution === 'external-worker') {
        return resultFor(request, {
          outcome: 'blocked',
          message: `${request.capability} requires an external worker before server dispatch.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'inbound-handler') {
        return resultFor(request, {
          outcome: 'blocked',
          message: `${request.capability} is an inbound server handler and is not dispatched to the external provider API.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'server-parameter') {
        return resultFor(request, {
          outcome: 'planned',
          message: `${request.capability} is a request parameter on an existing endpoint, not a standalone provider call.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'local-only') {
        return resultFor(request, {
          outcome: 'succeeded',
          message: `${request.capability} is handled locally and does not call the provider.`,
          authBoundary: definition.authBoundary,
        })
      }

      if (!input.apiKey) {
        return resultFor(request, {
          outcome: 'blocked',
          message: `${request.capability} needs a server-side API key before provider dispatch.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (!definition.method || !definition.path) {
        return resultFor(request, {
          outcome: 'blocked',
          message: `${request.capability} does not have a concrete provider endpoint yet.`,
          authBoundary: definition.authBoundary,
        })
      }

      const response = await fetchImpl(buildUrl(baseUrl, definition.path, definition.method, request.payload), {
        method: definition.method,
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: definition.method === 'POST' ? JSON.stringify(request.payload ?? {}) : undefined,
      })
      const providerBody = await readProviderBody(response)

      if (!response.ok) {
        return resultFor(request, {
          outcome: 'blocked',
          message: `${request.capability} provider request failed with HTTP ${response.status}.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      return resultFor(request, {
        outcome: 'succeeded',
        message: `${request.capability} dispatched through the server provider adapter.`,
        authBoundary: definition.authBoundary,
        endpoint: definition.path,
        providerTaskId: extractProviderTaskId(providerBody),
      })
    },
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST',
  payload?: Record<string, unknown>,
): string {
  const url = new URL(path, baseUrl)
  if (method === 'GET' && payload) {
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function readProviderBody(response: Response): Promise<unknown> {
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

function extractProviderTaskId(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined
  }
  const data = body.data
  if (isRecord(data) && typeof data.taskId === 'string') {
    return data.taskId
  }
  return undefined
}

function resultFor(
  request: ExecuteProviderActionRequest,
  result: Omit<ProviderActionResult, 'action' | 'capability' | 'receiptId'>,
): ProviderActionResult {
  return {
    action: request.action,
    capability: request.capability,
    receiptId: `server-action-${request.action}`,
    ...result,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
