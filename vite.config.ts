import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createProviderExportHandlers } from './server/providerExportHandlers'
import { createProviderExportNodeMiddleware } from './server/providerExportRoutes'
import { createProviderNodeMiddleware, createServerSunoProvider } from './server/providerRoutes'
import { createProjectStoreNodeMiddleware } from './server/projectStoreRoutes'
import { createRuntimeStatusHandlers } from './server/runtimeStatusHandlers'
import { createRuntimeStatusNodeMiddleware } from './server/runtimeStatusRoutes'
import { createSqliteProjectDatabase } from './server/sqliteProjectStore'
import { createSunoApiServerAdapter } from './server/sunoApiAdapter'

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  }

  return {
    plugins: [react(), providerExportRoutesPlugin(env)],
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
      setupFiles: './src/test/setup.ts',
    },
  }
})

function providerExportRoutesPlugin(env: NodeJS.ProcessEnv): Plugin {
  return {
    name: 'suno-provider-routes',
    configureServer(server) {
      const sunoApiKey = env.SUNO_API_KEY
      const providerMode = env.SUNO_PROVIDER_MODE ?? (sunoApiKey ? 'live' : 'blocked')
      const liveProvider = providerMode === 'live'
      const fixtureProvider = providerMode === 'fixture'
      const databasePath = resolve(env.KANTIKAL_DB_PATH ?? '.kantikal/the-kantikal.sqlite')
      mkdirSync(dirname(databasePath), { recursive: true })
      const database = createSqliteProjectDatabase(databasePath)
      const adapter = createSunoApiServerAdapter({
        runtime: 'server',
        apiKey: liveProvider ? sunoApiKey : fixtureProvider ? 'fixture-provider-key' : undefined,
        baseUrl: env.SUNO_API_BASE_URL,
        callbackUrl: env.SUNO_CALLBACK_URL ?? 'http://local.test/api/provider-exports/local/callback',
        fetchImpl: liveProvider ? undefined : fixtureProvider ? fixtureProviderFetch : blockedProviderFetch,
      })
      const provider = createServerSunoProvider({
        adapter,
      })
      const handlers = createProviderExportHandlers({
        adapter,
        store: database.providerExportStore,
      })
      const runtimeStatusHandlers = createRuntimeStatusHandlers({
        env: {
          ...env,
          SUNO_PROVIDER_MODE: providerMode,
        },
      })
      server.middlewares.use(createRuntimeStatusNodeMiddleware(runtimeStatusHandlers))
      server.middlewares.use(createProjectStoreNodeMiddleware(database.projectStore))
      server.middlewares.use(createProviderNodeMiddleware({ provider }))
      server.middlewares.use(createProviderExportNodeMiddleware(handlers, {
        async loadWorkflow(projectId) {
          return (await database.projectStore.loadProject(projectId))?.workflow ?? null
        },
      }))
      server.httpServer?.once('close', () => database.close())
    },
  }
}

async function blockedProviderFetch(): Promise<Response> {
  return new Response(
    JSON.stringify({
      code: 503,
      msg: 'SUNO_API_KEY is required before provider routes can create songs or outputs',
      data: null,
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  )
}

async function fixtureProviderFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = new URL(String(url))
  const taskId = requestUrl.searchParams.get('taskId') ?? 'task_local'

  if (init?.method === 'POST') {
    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'HTTP provider action route dispatched fixture provider task',
        data: {
          taskId: `task_${requestUrl.pathname.split('/').filter(Boolean).pop() ?? 'provider'}`,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      code: 200,
      msg: 'HTTP provider export route produced fixture downloadable outputs',
      data: {
        taskId,
        status: 'SUCCESS',
        response: {
          sunoData: [
            {
              id: `${taskId}-track-2`,
              title: 'HTTP routed provider output',
              audioUrl: `https://cdn.example.test/${taskId}/master.mp3`,
              imageUrl: `https://cdn.example.test/${taskId}/cover.jpeg`,
              vocal_url: `https://cdn.example.test/${taskId}/vocals.mp3`,
            },
          ],
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
