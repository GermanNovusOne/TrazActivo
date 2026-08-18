import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

describe('Design System states', () => {
  it('expone loading con anuncio accesible', () => {
    render(<LoadingState label="Verificando" />)
    expect(screen.getByRole('status')).toHaveTextContent('Verificando')
  })

  it('expone empty state con encabezado', () => {
    render(<EmptyState title="Sin contenido" description="No existen datos." />)
    expect(screen.getByRole('heading', { name: 'Sin contenido' })).toBeInTheDocument()
  })

  it('expone error state como alerta', () => {
    render(<ErrorState title="No disponible" description="No fue posible cargar." />)
    expect(screen.getByRole('alert')).toHaveTextContent('No disponible')
  })
})
