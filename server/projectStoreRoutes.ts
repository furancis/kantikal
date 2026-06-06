import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ProjectStore, ProjectWorkflowSnapshot } from '../src/api/projectStore'
import { assertLocalBrowserWrite, LocalAccessError } from './localAccess'

type RoutePayload = {
  snapshot?: ProjectWorkflowSnapshot
}

const routePrefix = '/api/projects'
const maxProjectBodyBytes = 2_097_152

export function createProjectStoreRequestHandler(store: ProjectStore) {
  return async function handleProjectStoreRequest(request: Request): Promise<Response> {
    try {
      const route = parseProjectRoute(request)
      if (!route) {
        return jsonError('Project route not found', 404)
      }

      if (request.method === 'GET' && route.kind === 'list') {
        return json({ projects: await store.listProjects() })
      }

      if (request.method === 'GET' && route.kind === 'project') {
        return json({ snapshot: await store.loadProject(route.projectId) })
      }

      if (request.method === 'PUT' && route.kind === 'project') {
        assertLocalBrowserWrite(request)
        const payload = await readRoutePayload(request)
        if (!payload.snapshot || payload.snapshot.projectId !== route.projectId) {
          return jsonError('Project route requires matching project snapshot', 400)
        }
        return json({ summary: await store.saveProject(payload.snapshot) })
      }

      return jsonError('Project route method not allowed', 405)
    } catch (error) {
      return jsonError(errorMessage(error, 'Project route failed'), errorStatus(error))
    }
  }
}

export function createProjectStoreNodeMiddleware(store: ProjectStore) {
  const requestHandler = createProjectStoreRequestHandler(store)

  return async function projectStoreNodeMiddleware(
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
      await writeNodeResponse(response, jsonError(errorMessage(error, 'Project route failed'), errorStatus(error)))
    }
  }
}

function parseProjectRoute(request: Request): { kind: 'list' } | { kind: 'project'; projectId: string } | null {
  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'api' || segments[1] !== 'projects') {
    return null
  }
  if (segments.length === 2) {
    return { kind: 'list' }
  }
  if (segments.length === 3) {
    return { kind: 'project', projectId: decodeURIComponent(segments[2]) }
  }
  return null
}

async function readRoutePayload(request: Request): Promise<RoutePayload> {
  try {
    const payload = (await request.json()) as unknown
    return isRecord(payload) ? payload : {}
  } catch {
    throw new RouteError('Project route requires JSON request body', 400)
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status)
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
      if (Buffer.byteLength(body, 'utf8') > maxProjectBodyBytes) {
        settled = true
        reject(new RouteError('Project request body too large', 413))
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

function errorStatus(error: unknown): number {
  return error instanceof RouteError || error instanceof LocalAccessError ? error.status : 500
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
