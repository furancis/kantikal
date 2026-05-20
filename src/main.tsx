import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createFetchProviderExportRuntimeClient } from './api/exportRuntime'
import './styles.css'

const exportRuntime = createFetchProviderExportRuntimeClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App exportRuntime={exportRuntime} />
  </StrictMode>,
)
