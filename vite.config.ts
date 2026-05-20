import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { createMockSunoProvider } from './src/api/provider'
import { createMemoryProviderExportStore, createProviderExportHandlers } from './server/providerExportHandlers'
import { createProviderExportNodeMiddleware } from './server/providerExportRoutes'
import { createProviderNodeMiddleware, createServerSunoProvider } from './server/providerRoutes'
import { createSunoApiServerAdapter } from './server/sunoApiAdapter'

export default defineConfig({
  plugins: [react(), providerExportRoutesPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    setupFiles: './src/test/setup.ts',
  },
})

function providerExportRoutesPlugin(): Plugin {
  return {
    name: 'suno-provider-routes',
    configureServer(server) {
      const adapter = createSunoApiServerAdapter({
        runtime: 'server',
        apiKey: process.env.SUNO_API_KEY ?? 'local-dev-provider-key',
        fetchImpl: localProviderFetch,
      })
      const provider = createServerSunoProvider({
        adapter,
        fallback: createMockSunoProvider(),
      })
      const handlers = createProviderExportHandlers({
        adapter,
        store: createMemoryProviderExportStore(),
      })
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
              id: 'mock-track-2',
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
