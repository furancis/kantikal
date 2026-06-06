import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ProviderExportSnapshot } from '../src/api/exportState'
import { exportSnapshotFromWorkflow } from '../src/api/exportState'
import type { providerWorkflow } from '../src/domain/workflow'
import type { ProviderExportHandlers } from './providerExportHandlers'
import { assertLocalBrowserWrite, LocalAccessError } from './localAccess'

type RoutePayload = {
  workflow?: providerWorkflow
  body?: unknown
}

type JsonResponseBody = {
  state: ProviderExportSnapshot | null
}

type ProviderExportRouteOptions = {
  loadWorkflow?: (projectId: string) => Promise<providerWorkflow | null>
}

const routePrefix = '/api/provider-exports'
const maxProviderExportBodyBytes = 1_048_576

export function createProviderExportRequestHandler(
  handlers: ProviderExportHandlers,
  options: ProviderExportRouteOptions = {},
) {
  return async function handleProviderExportRequest(request: Request): Promise<Response> {
    try {
      const route = parseProviderExportRoute(request)
      if (!route) {
        return jsonError('Provider export route not found', 404)
      }

      if (request.method === 'GET' && route.action === null) {
        return json({ state: await handlers.hydrateProviderExports(route.projectId) })
      }

      if (request.method !== 'POST') {
        return jsonError('Provider export route method not allowed', 405)
      }

      assertLocalBrowserWrite(request)
      const payload = await readRoutePayload(request)
      const workflow = await routeWorkflow(route.projectId, payload, options)

      if (route.action === 'poll-generation-task') {
        const providerTaskId = workflow.generationBatch?.providerJobId
        if (!providerTaskId) {
          return json({ state: exportSnapshotFromWorkflow(route.projectId, workflow) })
        }
        const result = await handlers.pollProviderTask({
          projectId: route.projectId,
          workflow,
          providerTaskId,
          action: 'pollGenerationStatus',
          capability: 'Get music generation details',
          receiptId: `poll-${providerTaskId}`,
        })
        return json({ state: result.state })
      }

      if (route.action === 'callback') {
        const providerTaskId = workflow.generationBatch?.providerJobId ?? 'unknown-task'
        const result = await handlers.receiveProviderCallback({
          projectId: route.projectId,
          workflow,
          body: payload.body ?? failedCallbackBody(providerTaskId),
          action: 'handleProviderCallback',
          capability: 'Webhooks/retries',
          receiptId: `callback-${providerTaskId}`,
        })
        return json({ state: result.state })
      }

      if (route.action === 'video-output') {
        const result = await handlers.recordProviderVideoOutput({
          projectId: route.projectId,
          workflow,
        })
        return json({ state: result.state })
      }

      return jsonError('Provider export route not found', 404)
    } catch (error) {
      return jsonError(errorMessage(error, 'Provider export route failed'), errorStatus(error))
    }
  }
}

export function createProviderExportNodeMiddleware(
  handlers: ProviderExportHandlers,
  options: ProviderExportRouteOptions = {},
) {
  const requestHandler = createProviderExportRequestHandler(handlers, options)

  return async function providerExportNodeMiddleware(
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): Promise<void> {
    if (!request.url?.startsWith(routePrefix)) {
      next()
      return
    }

    try {
      const webRequest = new Request(new URL(request.url, 'http://local.test'), {
        method: request.method ?? 'GET',
        headers: nodeHeaders(request),
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await readNodeBody(request),
      })
      await writeNodeResponse(response, await requestHandler(webRequest))
    } catch (error) {
      await writeNodeResponse(
        response,
        jsonError(errorMessage(error, 'Provider export route failed'), errorStatus(error)),
      )
    }
  }
}

function parseProviderExportRoute(request: Request): {
  projectId: string
  action: string | null
} | null {
  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'api' || segments[1] !== 'provider-exports' || !segments[2]) {
    return null
  }

  return {
    projectId: decodeURIComponent(segments[2]),
    action: segments[3] ?? null,
  }
}

async function readRoutePayload(request: Request): Promise<RoutePayload> {
  try {
    return (await request.json()) as RoutePayload
  } catch {
    throw new RouteError('Provider export route requires JSON request body', 400)
  }
}

async function routeWorkflow(
  projectId: string,
  payload: RoutePayload,
  options: ProviderExportRouteOptions,
): Promise<providerWorkflow> {
  if (options.loadWorkflow) {
    const workflow = await options.loadWorkflow(projectId)
    if (!workflow) {
      throw new RouteError('Provider export route requires a persisted server workflow', 409)
    }
    return workflow
  }
  if (!isRecord(payload.workflow)) {
    throw new RouteError('Provider export route requires workflow state', 400)
  }
  return payload.workflow as providerWorkflow
}

function json(body: JsonResponseBody, status = 200): Response {
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

function failedCallbackBody(providerTaskId: string): unknown {
  return {
    code: 451,
    msg: 'Provider callback reported file download failure',
    data: {
      callbackType: 'complete',
      task_id: providerTaskId,
      data: [],
    },
  }
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
      if (Buffer.byteLength(body, 'utf8') > maxProviderExportBodyBytes) {
        settled = true
        reject(new RouteError('Provider export request body too large', 413))
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
