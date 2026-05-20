import type { IncomingMessage, ServerResponse } from 'node:http'
import { createMockSunoProvider, executeProviderAction } from '../src/api/provider'
import type {
  ExecuteProviderActionRequest,
  GenerateBatchRequest,
  SunoProvider,
} from '../src/api/provider'
import type { GenerationBatch } from '../src/domain/workflow'
import type { SunoApiServerAdapter } from './sunoApiAdapter'

type ProviderRoutePayload = {
  request?: unknown
}

type ProviderRouteResponseBody =
  | { batch: GenerationBatch }
  | { result: Awaited<ReturnType<typeof executeProviderAction>> }

export type ServerSunoProviderInput = {
  adapter: SunoApiServerAdapter
  fallback?: SunoProvider
}

const routePrefix = '/api/provider'
const maxProviderBodyBytes = 1_048_576

export function createServerSunoProvider(input: ServerSunoProviderInput): SunoProvider {
  const fallback = input.fallback ?? createMockSunoProvider()

  return {
    async generateBatch(request) {
      const fallbackBatch = await fallback.generateBatch(request)
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

      return {
        ...fallbackBatch,
        providerJobId: result.providerTaskId ?? fallbackBatch.providerJobId,
      }
    },

    executeAction(request) {
      return input.adapter.executeProviderAction(request)
    },
  }
}

export function createProviderRequestHandler(input: { provider: SunoProvider }) {
  return async function handleProviderRequest(request: Request): Promise<Response> {
    try {
      const route = parseProviderRoute(request)
      if (!route) {
        return jsonError('Provider route not found', 404)
      }

      if (request.method !== 'POST') {
        return jsonError('Provider route method not allowed', 405)
      }

      const payload = await readRoutePayload(request)

      if (route.action === 'generate-batch') {
        return json({ batch: await input.provider.generateBatch(generateBatchRequest(payload)) })
      }

      if (route.action === 'actions') {
        return json({ result: await executeProviderAction(input.provider, providerActionRequest(payload)) })
      }

      return jsonError('Provider route not found', 404)
    } catch (error) {
      return jsonError(errorMessage(error, 'Provider route failed'), error instanceof RouteError ? error.status : 500)
    }
  }
}

export function createProviderNodeMiddleware(input: { provider: SunoProvider }) {
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
        jsonError(errorMessage(error, 'Provider route failed'), error instanceof RouteError ? error.status : 500),
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
  return request as GenerateBatchRequest
}

function providerActionRequest(payload: ProviderRoutePayload): ExecuteProviderActionRequest {
  const request = payload.request
  if (!isRecord(request)) {
    throw new RouteError('Provider route requires provider action request', 400)
  }
  return request as ExecuteProviderActionRequest
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
