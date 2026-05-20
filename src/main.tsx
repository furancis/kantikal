import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createFetchProviderExportRuntimeClient } from './api/exportRuntime'
import { createFetchSunoProvider } from './api/provider'
import './styles.css'

const provider = createFetchSunoProvider()
const exportRuntime = createFetchProviderExportRuntimeClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App provider={provider} exportRuntime={exportRuntime} />
  </StrictMode>,
)
