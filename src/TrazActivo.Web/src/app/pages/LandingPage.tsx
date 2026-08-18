import { ArrowRight, Server } from 'lucide-react'
import { StatusBadge, type StatusTone } from '../../design-system/components/StatusBadge'
import { useServiceHealth, type ServiceHealthState } from '../../platform/health/useServiceHealth'

const healthPresentation: Record<ServiceHealthState, { label: string; tone: StatusTone }> = {
  loading: { label: 'Verificando servicio', tone: 'loading' },
  healthy: { label: 'Servicio operativo', tone: 'healthy' },
  unavailable: { label: 'Servicio no disponible', tone: 'unavailable' },
}

export function LandingPage() {
  const health = useServiceHealth()
  const serviceStatus = healthPresentation[health]

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="wordmark" href="/" aria-label="TrazActivo, inicio">TrazActivo</a>
        <StatusBadge label="Ambiente DEV" tone="development" />
      </header>

      <main className="landing-main" id="main-content">
        <section className="landing-intro" aria-labelledby="landing-title">
          <div className="landing-intro__rule" aria-hidden="true" />
          <p className="landing-descriptor">Gestión patrimonial y auxiliar contable</p>
          <h1 id="landing-title">TrazActivo</h1>
          <p className="landing-motto">Cada activo tiene una historia verificable.</p>
          <a className="primary-action" href="/login">
            <span>Ingresar</span>
            <ArrowRight aria-hidden="true" />
          </a>
        </section>

        <section className="service-strip" aria-labelledby="service-heading">
          <div className="service-strip__title">
            <Server aria-hidden="true" />
            <h2 id="service-heading">Estado del servicio</h2>
          </div>
          <StatusBadge label={serviceStatus.label} tone={serviceStatus.tone} />
        </section>
      </main>

      <footer className="landing-footer">
        <span>TrazActivo</span>
        <span>Ambiente de desarrollo</span>
      </footer>
    </div>
  )
}
