import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/accessibility'
import { LandingPage } from './LandingPage'

const healthyResponse = () => new Response('{"status":"Healthy"}', {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

describe('LandingPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra la identidad textual aprobada y el acceso', () => {
    vi.mocked(fetch).mockResolvedValue(healthyResponse())

    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'TrazActivo' })).toBeInTheDocument()
    expect(screen.getByText('Gestión patrimonial y auxiliar contable')).toBeInTheDocument()
    expect(screen.getByText('Cada activo tiene una historia verificable.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login')
    expect(screen.getByText('Ambiente DEV')).toBeInTheDocument()
  })

  it('presenta el estado de health como loading mientras espera', async () => {
    let completeRequest: ((response: Response) => void) | undefined
    const pending = new Promise<Response>((resolve) => {
      completeRequest = resolve
    })
    vi.mocked(fetch).mockReturnValue(pending)

    render(<LandingPage />)
    expect(screen.getByText('Verificando servicio')).toBeInTheDocument()

    completeRequest?.(healthyResponse())
    await screen.findByText('Servicio operativo')
  })

  it('presenta el estado healthy sólo cuando ambos endpoints responden', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(healthyResponse())
      .mockResolvedValueOnce(healthyResponse())

    render(<LandingPage />)

    expect(await screen.findByText('Servicio operativo')).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.map(([path]) => path)).toEqual(['/health/live', '/health/ready'])
  })

  it('presenta unavailable ante una respuesta no exitosa', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(healthyResponse())
      .mockResolvedValueOnce(new Response(null, { status: 503 }))

    render(<LandingPage />)

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
  })

  it('permite alcanzar el CTA mediante teclado', async () => {
    vi.mocked(fetch).mockResolvedValue(healthyResponse())
    const user = userEvent.setup()

    render(<LandingPage />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'TrazActivo, inicio' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveFocus()
  })

  it('no presenta violaciones automáticas de axe', async () => {
    vi.mocked(fetch).mockResolvedValue(healthyResponse())
    const { container } = render(<LandingPage />)
    await waitFor(() => expect(screen.getByText('Servicio operativo')).toBeInTheDocument())

    await expectNoAxeViolations(container)
  })
})
