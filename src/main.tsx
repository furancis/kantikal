import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createFetchProviderExportRuntimeClient } from './api/exportRuntime'
import { createFetchMusicVideoRuntimeClient } from './api/musicVideoRuntime'
import { createFetchSunoProvider } from './api/provider'
import { createFetchRuntimeStatusClient } from './api/runtimeStatus'
import './styles.css'

const provider = createFetchSunoProvider()
const exportRuntime = createFetchProviderExportRuntimeClient()
const musicVideoRuntime = createFetchMusicVideoRuntimeClient()
const runtimeStatusClient = createFetchRuntimeStatusClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      provider={provider}
      exportRuntime={exportRuntime}
      musicVideoRuntime={musicVideoRuntime}
      runtimeStatusClient={runtimeStatusClient}
    />
  </StrictMode>,
)
