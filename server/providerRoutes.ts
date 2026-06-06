import type { IncomingMessage, ServerResponse } from 'node:http'
import { executeProviderAction } from '../src/api/provider'
import type {
  ExecuteProviderActionRequest,
  GenerateBatchRequest,
  MusicProvider,
} from '../src/api/provider'
import type { GenerationBatch } from '../src/domain/workflow'
import type { providerApiServerAdapter } from './musicApiAdapter'
import { assertLocalBrowserWrite, LocalAccessError } from './localAccess'

type ProviderRoutePayload = {
  request?: unknown
}

type ProviderRouteResponseBody =
  | { batch: GenerationBatch }
  | { result: Awaited<ReturnType<typeof executeProviderAction>> }

export type ServerMusicProviderInput = {
  adapter: providerApiServerAdapter
}

const routePrefix = '/api/provider'
const maxProviderBodyBytes = 1_048_576

export function createServerMusicProvider(input: ServerMusicProviderInput): MusicProvider {
  return {
    async generateBatch(request) {
      const result = await input.adapter.executeProviderAction({
        action: 'generateBatch',
        capability: 'Create song',
        brief: request.brief,
        lyrics: request.lyrics,
        style: request.style,
        voice: request.voice,
        payload: {
          prompt: request.lyrics || request.brief,
          style: request.style,
          title: request.brief,
          count: request.count,
        },
      })

      if (result.outcome !== 'succeeded') {
        throw new RouteError(result.message, 503)
      }

      return providerGenerationBatch(request, result.providerTaskId)
    },

    executeAction(request) {
      return input.adapter.executeProviderAction(request)
    },
  }
}

export function createProviderRequestHandler(input: { provider: MusicProvider }) {
  return async function handleProviderRequest(request: Request): Promise<Response> {
    try {
      const route = parseProviderRoute(request)
      if (!route) {
        return jsonError('Provider route not found', 404)
      }

      if (request.method !== 'POST') {
        return jsonError('Provider route method not allowed', 405)
      }

      assertLocalBrowserWrite(request)
      const payload = await readRoutePayload(request)

      if (route.action === 'generate-batch') {
        return json({ batch: await input.provider.generateBatch(generateBatchRequest(payload)) })
      }

      if (route.action === 'actions') {
        return json({ result: await executeProviderAction(input.provider, providerActionRequest(payload)) })
      }

      return jsonError('Provider route not found', 404)
    } catch (error) {
      return jsonError(errorMessage(error, 'Provider route failed'), errorStatus(error))
    }
  }
}

export function createProviderNodeMiddleware(input: { provider: MusicProvider }) {
  const requestHandler = createProviderRequestHandler(input)

  return async function providerNodeMiddleware(
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): Promise<void> {
    if (!isProviderRouteUrl(request.url)) {
      next()
      return
    }

    try {
      const webRequest = new Request(new URL(request.url ?? routePrefix, 'http://local.test'), {
        method: request.method ?? 'GET',
        headers: nodeHeaders(request),
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await readNodeBody(request),
      })
      await writeNodeResponse(response, await requestHandler(webRequest))
    } catch (error) {
      await writeNodeResponse(
        response,
        jsonError(errorMessage(error, 'Provider route failed'), errorStatus(error)),
      )
    }
  }
}

function isProviderRouteUrl(url: string | undefined): boolean {
  return Boolean(url === routePrefix || url?.startsWith(`${routePrefix}/`))
}

function parseProviderRoute(request: Request): { action: string } | null {
  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'api' || segments[1] !== 'provider' || !segments[2]) {
    return null
  }
  return { action: segments[2] }
}

async function readRoutePayload(request: Request): Promise<ProviderRoutePayload> {
  try {
    const payload = (await request.json()) as unknown
    return isRecord(payload) ? payload : {}
  } catch {
    throw new RouteError('Provider route requires JSON request body', 400)
  }
}

function generateBatchRequest(payload: ProviderRoutePayload): GenerateBatchRequest {
  const request = payload.request
  if (!isRecord(request)) {
    throw new RouteError('Provider route requires generation request', 400)
  }
  return {
    brief: requiredString(request.brief, 'brief'),
    lyrics: requiredString(request.lyrics, 'lyrics'),
    style: requiredString(request.style, 'style'),
    voice: requiredString(request.voice, 'voice'),
    count: requiredPositiveInteger(request.count, 'count'),
  }
}

function providerActionRequest(payload: ProviderRoutePayload): ExecuteProviderActionRequest {
  const request = payload.request
  if (!isRecord(request)) {
    throw new RouteError('Provider route requires provider action request', 400)
  }
  return {
    action: requiredString(request.action, 'action'),
    capability: requiredString(request.capability, 'capability'),
    payload: optionalRecord(request.payload, 'payload'),
    brief: optionalString(request.brief, 'brief'),
    lyrics: optionalString(request.lyrics, 'lyrics'),
    style: optionalString(request.style, 'style'),
    voice: optionalString(request.voice, 'voice'),
  }
}

function providerGenerationBatch(request: GenerateBatchRequest, providerTaskId: string | undefined): GenerationBatch {
  const providerJobId = providerTaskId ?? `provider-${slugify(request.brief) || 'generation'}`
  const trackPrefix = providerTrackPrefix(providerJobId)
  const titleBase = displayBriefTitle(request.brief)

  return {
    providerJobId,
    tracks: Array.from({ length: request.count }, (_, index) => ({
      id: `${trackPrefix}-track-${index + 1}`,
      title: `${titleBase} provider take ${index + 1}`,
      durationSeconds: 150 + index * 4,
    })),
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new RouteError(`Provider route requires ${field} string`, 400)
  }
  return value
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined
  }
  return requiredString(value, field)
}

function optionalRecord(value: unknown, field: string): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!isRecord(value)) {
    throw new RouteError(`Provider route requires ${field} object`, 400)
  }
  return value
}

function requiredPositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < 1) {
    throw new RouteError(`Provider route requires ${field} positive integer`, 400)
  }
  return value
}

function json(body: ProviderRouteResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function nodeHeaders(request: IncomingMessage): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
    } else if (typeof value === 'string') {
      headers.set(key, value)
    }
  }
  return headers
}

function readNodeBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      if (settled) {
        return
      }
      body += chunk
      if (Buffer.byteLength(body, 'utf8') > maxProviderBodyBytes) {
        settled = true
        reject(new RouteError('Provider request body too large', 413))
        request.destroy()
      }
    })
    request.on('end', () => {
      if (settled) {
        return
      }
      settled = true
      resolve(body)
    })
    request.on('error', (error) => {
      if (settled) {
        return
      }
      settled = true
      reject(error)
    })
  })
}

async function writeNodeResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  response.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => response.setHeader(key, value))
  response.end(await webResponse.text())
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function errorStatus(error: unknown): number {
  return error instanceof RouteError || error instanceof LocalAccessError ? error.status : 500
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function displayBriefTitle(brief: string): string {
  return brief.split('\n')[0]?.trim() || 'music generation'
}

function providerTrackPrefix(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '') || 'provider-task'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

class RouteError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
