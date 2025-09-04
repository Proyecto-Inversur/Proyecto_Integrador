// ⚠️ Mocks ANTES de cualquier import del componente
vi.mock('react-transition-group', () => ({
  // Modal de react-bootstrap usa <Transition> y <CSSTransition>. Los anulamos.
  Transition: ({ children }: any) => (typeof children === 'function' ? children({}) : children),
  CSSTransition: ({ children }: any) => children,
  SwitchTransition: ({ children }: any) => children,
}))

vi.mock('@/services/userService', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}))

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import UserForm from '@/components/forms/UserForm'
import { AuthContext } from '@/context/AuthContext'
import * as userSvc from '@/services/userService'

function renderWithAuth(ui: React.ReactElement, ctx: any) {
  return render(<AuthContext.Provider value={ctx}>{ui}</AuthContext.Provider>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UserForm', () => {
  it('crear usuario: pide Google, llama createUser con payload y cierra', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue({
      idToken: 'tok-123',
      email: 'nuevo@demo.com',
    })
    const onClose = vi.fn()
    const createUser = vi.spyOn(userSvc, 'createUser').mockResolvedValue({} as any)

    renderWithAuth(<UserForm user={null} onClose={onClose} />, { signInWithGoogle })

    // No dependemos del role heading; buscamos el texto del título
    expect(screen.getByText(/crear usuario/i)).toBeInTheDocument()

    // Completar nombre para habilitar el botón
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Nuevo Usuario')

    const submit = screen.getByRole('button', { name: /registrar con google/i })
    expect(submit).toBeEnabled()

    await userEvent.click(submit)

    // Esperamos a que se resuelvan las promesas internas
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledWith(false))
    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        nombre: 'Nuevo Usuario',
        rol: 'Administrador',
        email: 'nuevo@demo.com',
        id_token: 'tok-123',
      })
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('editar usuario: prellena valores, llama updateUser y cierra', async () => {
    const user = { id: 7, nombre: 'Tomi Administrador', rol: 'Administrador' }
    const signInWithGoogle = vi.fn() // no debe llamarse en edición
    const onClose = vi.fn()
    const updateUser = vi.spyOn(userSvc, 'updateUser').mockResolvedValue({} as any)

    renderWithAuth(<UserForm user={user} onClose={onClose} />, { signInWithGoogle })

    expect(screen.getByText(/editar usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Tomi Administrador')
    expect(screen.getByLabelText(/rol/i)).toHaveValue('Administrador')

    // Editamos los valores
    await userEvent.clear(screen.getByLabelText(/nombre/i))
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Nombre Editado')
    await userEvent.selectOptions(
      screen.getByLabelText(/rol/i),
      'Encargado de Mantenimiento'
    )

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith(7, {
        nombre: 'Nombre Editado',
        rol: 'Encargado de Mantenimiento',
      })
    )
    expect(userSvc.createUser).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('valida: botón deshabilitado si falta el nombre', async () => {
    const signInWithGoogle = vi.fn()
    const onClose = vi.fn()

    renderWithAuth(<UserForm user={null} onClose={onClose} />, { signInWithGoogle })

    const submit = screen.getByRole('button', { name: /registrar con google/i })
    expect(submit).toBeDisabled()

    // Con nombre se habilita
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Ada')
    expect(submit).toBeEnabled()
  })
})
