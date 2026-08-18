import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import { App } from './app/App'
import './design-system/styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('TrazActivo frontend root element is missing.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
