import { providerActionDefinitionByAction } from '../src/api/actionCatalog'
import type {
  ExecuteProviderActionRequest,
  ProviderActionResult,
  ProviderRuntimeConfigInput,
} from '../src/api/provider'
import type {
  ProviderCallbackInput,
  ProviderTaskOutput,
  ProviderTaskUpdateInput,
} from '../src/domain/workflow'
import { buildProviderActionPayload } from './providerPayloads'

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type providerApiServerAdapterInput = ProviderRuntimeConfigInput & {
  fetchImpl?: FetchLike
  callbackUrl?: string
}

export type providerApiServerAdapter = {
  executeProviderAction(request: ExecuteProviderActionRequest): Promise<ProviderActionResult>
  pollProviderTask(request: ProviderPollRequest): Promise<ProviderTaskUpdateInput>
}

export type ProviderPollRequest = {
  providerTaskId: string
  action: string
  capability: string
  receiptId: string
}

export function createMusicApiServerAdapter(input: providerApiServerAdapterInput): providerApiServerAdapter {
  if (input.runtime !== 'server') {
    throw new Error('compatible-provider provider credentials must stay server-side')
  }

  const baseUrl = input.baseUrl ?? 'https://api.providerapi.org'
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
          message: `${request.capability} is not available in the current compatible-provider provider docs.`,
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
          outcome: 'succeeded',
          message: `${request.capability} is implemented as an inbound server handler and is not dispatched to the external provider API.`,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      if (definition.execution === 'server-parameter') {
        return resultFor(request, {
          outcome: 'succeeded',
          message: `${request.capability} is implemented as a typed request parameter on an existing provider endpoint.`,
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

      const providerPayload = buildProviderActionPayload({
        definition,
        request,
        defaultCallbackUrl: input.callbackUrl,
      })
      if (!providerPayload.ok) {
        return resultFor(request, {
          outcome: 'blocked',
          message: providerPayload.message,
          authBoundary: definition.authBoundary,
          endpoint: definition.path,
        })
      }

      const response = await fetchImpl(buildUrl(baseUrl, definition.path, definition.method, providerPayload.payload), {
        method: definition.method,
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: definition.method === 'POST' ? JSON.stringify(providerPayload.payload) : undefined,
      })
      const providerBody = await readProviderBody(response)
      const providerCode = providerStatusCode(providerBody)

      if (!response.ok || (providerCode !== undefined && providerCode !== 200)) {
        return resultFor(request, {
          outcome: 'blocked',
          message:
            providerCode !== undefined
              ? `${request.capability} provider request failed with HTTP ${response.status} and provider code ${providerCode}.`
              : `${request.capability} provider request failed with HTTP ${response.status}.`,
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
        providerResourceUrl: extractProviderResourceUrl(providerBody),
      })
    },

    async pollProviderTask(request) {
      const definition = providerActionDefinitionByAction(request.action)
      if (!definition || definition.execution !== 'server-ready' || definition.method !== 'GET' || !definition.path) {
        return {
          providerTaskId: request.providerTaskId,
          action: request.action,
          capability: request.capability,
          providerStatus: 'FAILED',
          message: `${request.capability} does not have a pollable server endpoint.`,
          outputs: [],
          receiptId: request.receiptId,
        }
      }

      if (!input.apiKey) {
        return {
          providerTaskId: request.providerTaskId,
          action: request.action,
          capability: request.capability,
          providerStatus: 'FAILED',
          message: `${request.capability} needs a server-side API key before provider polling.`,
          outputs: [],
          receiptId: request.receiptId,
        }
      }

      const response = await fetchImpl(buildUrl(baseUrl, definition.path, 'GET', { taskId: request.providerTaskId }), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      const providerBody = await readProviderBody(response)
      const providerCode = providerStatusCode(providerBody)

      if (!response.ok || (providerCode !== undefined && providerCode !== 200)) {
        return {
          providerTaskId: request.providerTaskId,
          action: request.action,
          capability: request.capability,
          providerStatus: 'FAILED',
          message:
            providerCode !== undefined
              ? `${request.capability} provider poll failed with HTTP ${response.status} and provider code ${providerCode}.`
              : `${request.capability} provider poll failed with HTTP ${response.status}.`,
          outputs: [],
          receiptId: request.receiptId,
        }
      }

      return normalizeProviderRecordInfo(providerBody, {
        action: request.action,
        capability: request.capability,
        receiptId: request.receiptId,
      })
    },
  }
}

export function normalizeProviderRecordInfo(
  body: unknown,
  input: { action: string; capability: string; receiptId: string },
): ProviderTaskUpdateInput {
  const root = asRecord(body)
  const data = asRecord(root.data)
  const response = asRecord(data.response)
  const records = asArray(response.providerData)

  return {
    providerTaskId: stringFrom(data.taskId) ?? 'unknown-task',
    action: input.action,
    capability: input.capability,
    providerStatus: stringFrom(data.status) ?? statusFromCode(numberFrom(root.code)),
    message: stringFrom(root.msg) ?? stringFrom(data.errorMessage) ?? 'Provider task status received',
    outputs: records.flatMap((record) => outputsFromMusicRecord(record)),
    receiptId: input.receiptId,
  }
}

export function normalizeProviderCallback(
  body: unknown,
  input: { action: string; capability: string; receiptId: string },
): ProviderCallbackInput {
  const root = asRecord(body)
  const data = asRecord(root.data)
  const code = numberFrom(root.code) ?? 500
  const taskId = stringFrom(data.task_id) ?? stringFrom(data.taskId) ?? 'unknown-task'
  const records = asArray(data.data)
  const images = asArray(data.images)
  const imageOutputs: ProviderTaskOutput[] = images.flatMap((image, index) =>
    typeof image === 'string'
      ? [
          {
            kind: 'cover-art' as const,
            label: `Cover art ${index + 1}`,
            url: image,
          },
        ]
      : [],
  )

  return {
    providerTaskId: taskId,
    action: input.action,
    capability: input.capability,
    callbackType: stringFrom(data.callbackType) ?? 'complete',
    code,
    providerStatus: code === 200 ? 'SUCCESS' : 'FAILED',
    message: stringFrom(root.msg) ?? 'Provider callback received',
    outputs: [...records.flatMap((record) => outputsFromMusicRecord(record)), ...imageOutputs],
    receiptId: input.receiptId,
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
  if (isRecord(data) && typeof data.task_id === 'string') {
    return data.task_id
  }
  if (typeof body.taskId === 'string') {
    return body.taskId
  }
  return undefined
}

function extractProviderResourceUrl(body: unknown): string | undefined {
  const root = asRecord(body)
  const data = asRecord(root.data)
  return (
    stringFrom(data.downloadUrl) ??
    stringFrom(data.fileUrl) ??
    stringFrom(data.url) ??
    stringFrom(root.downloadUrl) ??
    stringFrom(root.fileUrl) ??
    stringFrom(root.url)
  )
}

function outputsFromMusicRecord(recordValue: unknown): ProviderTaskOutput[] {
  const record = asRecord(recordValue)
  const sourceTrackId = stringFrom(record.id)
  const title = stringFrom(record.title) ?? sourceTrackId ?? 'Provider output'
  const audioUrl = stringFrom(record.audioUrl) ?? stringFrom(record.audio_url)
  const imageUrl = stringFrom(record.imageUrl) ?? stringFrom(record.image_url)
  const outputs: ProviderTaskOutput[] = []

  if (audioUrl) {
    outputs.push({
      kind: 'audio',
      label: `${title} audio`,
      url: audioUrl,
      sourceTrackId,
    })
  }

  if (imageUrl) {
    outputs.push({
      kind: 'cover-art',
      label: `${title} cover art`,
      url: imageUrl,
      sourceTrackId,
    })
  }

  for (const [key, value] of Object.entries(record)) {
    if (key.endsWith('_url') && typeof value === 'string') {
      const stemName = stemNameFromUrlField(key)
      if (stemName) {
        outputs.push({
          kind: 'stem',
          label: `${title} ${stemName} stem`,
          url: value,
          sourceTrackId,
          stemName,
        })
      }
    }
  }

  return outputs
}

function stemNameFromUrlField(key: string): string | null {
  const stemFields = new Set([
    'vocal_url',
    'backing_vocals_url',
    'drums_url',
    'bass_url',
    'guitar_url',
    'keyboard_url',
    'percussion_url',
    'strings_url',
    'synth_url',
    'fx_url',
    'brass_url',
    'woodwinds_url',
    'instrumental_url',
  ])
  return stemFields.has(key) ? key.replace(/_url$/, '').replace(/_/g, '-') : null
}

function statusFromCode(code: number | undefined): string {
  return code === 200 ? 'SUCCESS' : 'FAILED'
}

function providerStatusCode(body: unknown): number | undefined {
  const root = asRecord(body)
  return numberFrom(root.code)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function numberFrom(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
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
