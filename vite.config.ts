import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { createMemoryProviderExportStore, createProviderExportHandlers } from './server/providerExportHandlers'
import { createProviderExportNodeMiddleware } from './server/providerExportRoutes'
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
    name: 'suno-provider-export-routes',
    configureServer(server) {
      const handlers = createProviderExportHandlers({
        adapter: createSunoApiServerAdapter({
          runtime: 'server',
          apiKey: process.env.SUNO_API_KEY ?? 'local-dev-provider-key',
          fetchImpl: localProviderFetch,
        }),
        store: createMemoryProviderExportStore(),
      })
      server.middlewares.use(createProviderExportNodeMiddleware(handlers))
    },
  }
}

async function localProviderFetch(url: string | URL): Promise<Response> {
  const requestUrl = new URL(String(url))
  const taskId = requestUrl.searchParams.get('taskId') ?? 'task_local'

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
