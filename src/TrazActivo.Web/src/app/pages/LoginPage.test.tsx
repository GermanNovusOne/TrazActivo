import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../test/accessibility'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('expone una experiencia visual sin credenciales ni autenticación', () => {
    const { container } = render(<LoginPage />)

    expect(screen.getByRole('heading', { name: 'Identidad no implementada' })).toBeInTheDocument()
    expect(screen.getByText('El acceso autenticado todavía no está habilitado en este ambiente.')).toBeInTheDocument()
    expect(container.querySelector('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('mantiene navegación por teclado hacia el inicio', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.tab()
    expect(screen.getByRole('link', { name: 'TrazActivo, ir al inicio' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveFocus()
  })

  it('no presenta violaciones automáticas de axe', async () => {
    const { container } = render(<LoginPage />)
    await expectNoAxeViolations(container)
  })
})
