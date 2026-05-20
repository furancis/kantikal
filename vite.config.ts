import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { createMemoryProviderExportStore, createProviderExportHandlers } from './server/providerExportHandlers'
import { createProviderExportNodeMiddleware } from './server/providerExportRoutes'
import { createProviderNodeMiddleware, createServerSunoProvider } from './server/providerRoutes'
import { createRuntimeStatusHandlers } from './server/runtimeStatusHandlers'
import { createRuntimeStatusNodeMiddleware } from './server/runtimeStatusRoutes'
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
      const providerMode = env.SUNO_PROVIDER_MODE ?? (sunoApiKey ? 'live' : 'local')
      const liveProvider = providerMode === 'live'
      const adapter = createSunoApiServerAdapter({
        runtime: 'server',
        apiKey: liveProvider ? sunoApiKey : 'local-dev-provider-key',
        baseUrl: env.SUNO_API_BASE_URL,
        callbackUrl: env.SUNO_CALLBACK_URL ?? 'http://local.test/api/provider-exports/local/callback',
        fetchImpl: liveProvider ? undefined : localProviderFetch,
      })
      const provider = createServerSunoProvider({
        adapter,
      })
      const handlers = createProviderExportHandlers({
        adapter,
        store: createMemoryProviderExportStore(),
      })
      const runtimeStatusHandlers = createRuntimeStatusHandlers({
        env: {
          ...env,
          SUNO_PROVIDER_MODE: providerMode,
        },
      })
      server.middlewares.use(createRuntimeStatusNodeMiddleware(runtimeStatusHandlers))
      server.middlewares.use(createProviderNodeMiddleware({ provider }))
      server.middlewares.use(createProviderExportNodeMiddleware(handlers))
    },
  }
}

async function localProviderFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = new URL(String(url))
  const taskId = requestUrl.searchParams.get('taskId') ?? 'task_local'

  if (init?.method === 'POST') {
    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'HTTP provider action route dispatched local provider task',
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
      msg: 'HTTP provider export route produced local downloadable outputs',
      data: {
        taskId,
        status: 'SUCCESS',
        response: {
          sunoData: [
            {
              id: `${taskId}-track-2`,
              title: 'HTTP routed provider output',
              audioUrl: `local-export://${taskId}/master.mp3`,
              imageUrl: `local-export://${taskId}/cover.jpeg`,
              vocal_url: `local-export://${taskId}/vocals.mp3`,
            },
          ],
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
