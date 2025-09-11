import React from 'react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Users from '@/pages/Users'
import * as userSvc from '@/services/userService'

/** Desactiva transiciones del Modal para evitar warnings de act(...) */
vi.mock('react-transition-group', () => ({
  CSSTransition: ({ children }: any) => children,
  Transition: ({ children }: any) => children,
}))

/** Stub muy simple del formulario para no depender de react-bootstrap Modal */
vi.mock('@/components/UserForm', () => ({
  default: ({ user, onClose }: any) => (
    <div role="dialog" aria-modal="true">
      <h2>{user ? 'Editar Usuario' : 'Crear Usuario'}</h2>
      <button onClick={onClose}>Cerrar</button>
    </div>
  ),
}))

/** BackButton ligero para que sea accesible en el DOM */
vi.mock('@/components/BackButton', () => ({
  default: () => <button>Volver</button>,
}))

/** Mock del service */
vi.mock('@/services/userService', () => ({
  getUsers: vi.fn(),
  deleteUser: vi.fn().mockResolvedValue({}),
}))

const FAKE_USERS = [
  { id: 1, nombre: 'Tomi Administrador', email: 'tomi@demo.com', rol: 'Administrador' },
  { id: 4, nombre: 'Facu Administrador', email: 'facu@demo.com', rol: 'Administrador' },
]

async function renderPage() {
  const utils = render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>
  )
  // Esperamos a que cargue la tabla
  await screen.findByText(/gestión de usuarios/i)
  await waitFor(() => {
    // header + filas
    expect(screen.getAllByRole('row')).toHaveLength(FAKE_USERS.length + 1)
  })
  return utils
}

beforeEach(() => {
  (userSvc.getUsers as any).mockReset()
  ;(userSvc.deleteUser as any).mockClear()
  // Primera carga con 2 usuarios
  ;(userSvc.getUsers as any).mockResolvedValue({ data: FAKE_USERS })
})

afterEach(() => vi.clearAllMocks())

describe('Users page', () => {
  it('muestra el título y la tabla con los usuarios', async () => {
    await renderPage()

    // Sin alerta de error
    expect(screen.queryByRole('alert')).toBeNull()

    // Nombres presentes
    expect(screen.getByText('Tomi Administrador')).toBeInTheDocument()
    expect(screen.getByText('Facu Administrador')).toBeInTheDocument()
  })

  it('abre el formulario al clickear "Agregar"', async () => {
    await renderPage()

    await userEvent.click(screen.getByRole('button', { name: /agregar/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument()
  })

  it('abre el formulario en modo edición al clickear el botón editar de una fila', async () => {
    await renderPage()

    const row = screen.getByText('Facu Administrador').closest('tr')!
    const [btnEditar] = within(row).getAllByRole('button') // [Editar, Eliminar]
    await userEvent.click(btnEditar)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument()
  })

  it('elimina un usuario al clickear el botón de eliminar y refresca la lista', async () => {
    await renderPage()

    // Preparamos el "segundo fetch" con la lista ya sin el usuario eliminado (Tomi)
    ;(userSvc.getUsers as any).mockResolvedValueOnce({
      data: FAKE_USERS.filter(u => u.id !== 1),
    })

    const row = screen.getByText('Tomi Administrador').closest('tr')!
    const buttons = within(row).getAllByRole('button')
    const btnEliminar = buttons[1] // [Editar, Eliminar]
    await userEvent.click(btnEliminar)

    expect(userSvc.deleteUser).toHaveBeenCalledWith(1)

    // La lista se actualiza y ya no debe estar "Tomi Administrador"
    await waitFor(() => {
      expect(screen.queryByText('Tomi Administrador')).not.toBeInTheDocument()
    })
  })
})
