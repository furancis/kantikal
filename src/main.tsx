import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createFetchProviderExportRuntimeClient } from './api/exportRuntime'
import { createFetchMusicVideoRuntimeClient, createLocalMusicVideoRuntimeClient } from './api/musicVideoRuntime'
import { createFetchProjectStore } from './api/projectStore'
import { createFetchMusicProvider } from './api/provider'
import { createFetchRuntimeStatusClient } from './api/runtimeStatus'
import './styles.css'

const provider = createFetchMusicProvider()
const exportRuntime = createFetchProviderExportRuntimeClient()
const musicVideoRuntime = createFetchMusicVideoRuntimeClient(
  import.meta.env.VITE_ALLOW_FIXTURE_LIPSYNC === '1'
    ? { fallback: createLocalMusicVideoRuntimeClient() }
    : {},
)
const projectStore = createFetchProjectStore()
const runtimeStatusClient = createFetchRuntimeStatusClient()
const routeProjectId = new URL(window.location.href).searchParams.get('projectId') ?? undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      provider={provider}
      exportRuntime={exportRuntime}
      musicVideoRuntime={musicVideoRuntime}
      projectStore={projectStore}
      projectId={routeProjectId}
      runtimeStatusClient={runtimeStatusClient}
    />
  </StrictMode>,
)
