import { ErrorState } from '../design-system/components/ErrorState'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { PreviewPage } from './pages/PreviewPage'

const routes: Record<string, () => React.JSX.Element> = {
  '/': LandingPage,
  '/login': LoginPage,
  '/preview': PreviewPage,
}

export function App() {
  const Page = routes[window.location.pathname]

  if (!Page) {
    return (
      <main className="route-error" id="main-content">
        <ErrorState title="Página no disponible" description="La ruta solicitada no forma parte de esta experiencia." />
        <a className="text-link" href="/">Volver al inicio</a>
      </main>
    )
  }

  return <Page />
}
