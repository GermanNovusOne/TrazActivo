import { StatusBadge } from './StatusBadge'

export function Topbar() {
  return (
    <header className="app-topbar">
      <a className="wordmark wordmark--compact" href="/" aria-label="TrazActivo, ir al inicio">
        TrazActivo
      </a>
      <StatusBadge label="Vista previa DEV" tone="development" />
    </header>
  )
}
