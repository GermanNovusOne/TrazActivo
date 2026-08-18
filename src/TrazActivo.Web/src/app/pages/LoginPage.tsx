import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { StatusBadge } from '../../design-system/components/StatusBadge'

export function LoginPage() {
  return (
    <div className="login-page">
      <header className="simple-header">
        <a className="wordmark" href="/" aria-label="TrazActivo, ir al inicio">TrazActivo</a>
        <StatusBadge label="Ambiente DEV" tone="development" />
      </header>

      <main className="login-main" id="main-content">
        <section className="login-notice" aria-labelledby="login-title">
          <LockKeyhole aria-hidden="true" />
          <p className="section-label">Acceso</p>
          <h1 id="login-title">Identidad no implementada</h1>
          <p>El acceso autenticado todavía no está habilitado en este ambiente.</p>
          <a className="secondary-action" href="/">
            <ArrowLeft aria-hidden="true" />
            <span>Volver al inicio</span>
          </a>
        </section>
      </main>
    </div>
  )
}
