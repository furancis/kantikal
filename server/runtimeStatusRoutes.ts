import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RuntimeStatus } from '../src/api/runtimeStatus'

export type RuntimeStatusHandlers = {
  getStatus(): Promise<RuntimeStatus>
}

export function createRuntimeStatusNodeMiddleware(handlers: RuntimeStatusHandlers) {
  return function runtimeStatusNodeMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
    if (!req.url?.startsWith('/api/runtime/status')) {
      next()
      return
    }

    if (req.method !== 'GET') {
      writeJson(res, 405, { error: 'Method not allowed' })
      return
    }

    void handlers
      .getStatus()
      .then((status) => writeJson(res, 200, { status }))
      .catch((error) =>
        writeJson(res, 500, {
          error: error instanceof Error ? error.message : 'Runtime status failed',
        }),
      )
  }
}

function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
