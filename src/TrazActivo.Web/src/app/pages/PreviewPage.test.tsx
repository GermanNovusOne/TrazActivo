import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../test/accessibility'
import { PreviewPage } from './PreviewPage'

const expectedNavigation = [
  'Inicio',
  'Activos',
  'Inventarios',
  'Movimientos',
  'Adquisiciones',
  'Contabilidad',
  'Mantenimiento',
  'Reportes',
  'Auditoría',
  'Configuración',
]

describe('PreviewPage', () => {
  it('muestra el AppShell y toda la navegación PDD como no funcional', () => {
    render(<PreviewPage />)

    const navigation = screen.getByRole('navigation', { name: 'Módulos previstos' })
    for (const label of expectedNavigation) {
      expect(navigation).toHaveTextContent(label)
    }
    expect(navigation.querySelectorAll('[aria-disabled="true"]')).toHaveLength(expectedNavigation.length)
  })

  it('muestra el EmptyState sin datos funcionales ni controles de módulo', () => {
    render(<PreviewPage />)

    expect(screen.getByRole('heading', { name: 'Vista previa de interfaz DEV. Sin datos funcionales.' })).toBeInTheDocument()
    expect(screen.getByText('Los módulos de navegación todavía no están implementados.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('no presenta violaciones automáticas de axe', async () => {
    const { container } = render(<PreviewPage />)
    await expectNoAxeViolations(container)
  })
})
