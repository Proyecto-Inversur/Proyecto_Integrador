import React from 'react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import * as notifSvc from '@/services/notificaciones'

import AppNavbar from '@/components/Navbar'
import { AuthContext } from '@/context/AuthContext'

// Mocks EXACTOS de los módulos que importa el Navbar
vi.mock('@/services/notificaciones', () => ({
  get_notificaciones_correctivos: vi.fn().mockResolvedValue({ data: [] }),
  get_notificaciones_preventivos: vi.fn().mockResolvedValue({ data: [] }),
  correctivo_leido: vi.fn().mockResolvedValue({}),
  preventivo_leido: vi.fn().mockResolvedValue({}),
  delete_notificacion: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/services/notificationWs', () => ({
  subscribeToNotifications: vi.fn(() => ({ close: vi.fn() })),
}))

function renderWithProviders() {
  const authValue = {
    verifying: false,
    currentEntity: { data: { uid: 'test-uid', nombre: 'Usuario' } },
    logOut: vi.fn(),
  } as any

  const utils = render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  return { ...utils, authValue }
}

async function openNotifications() {
  const bell = screen.getByLabelText(/notificaciones/i)
  await userEvent.click(bell)

  const dialog = await screen.findByRole('dialog')
  // si usaste as="h2" en Modal.Title, esto funciona;
  // si no, cambia por getByText(/^Notificaciones$/i)
  expect(within(dialog).getByRole('heading', { name: /notificaciones/i })).toBeInTheDocument()

  const loading = within(dialog).queryByText(/cargando/i)
  if (loading) {
    await waitForElementToBeRemoved(() => within(dialog).getByText(/cargando/i))
  }
  return dialog
}

describe('Navbar → Notificaciones', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  it('abre el modal y muestra estado vacío', async () => {
    renderWithProviders()
    const dialog = await openNotifications()

    expect(within(dialog).getByText(/no tienes notificaciones/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /marcar todas como leídas/i })).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: /eliminar leídas/i })).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: /cerrar sesión/i })).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: /^cerrar$/i })).toBeEnabled()
  })

  it('marca todas como leídas (correctivo + preventivo no leídos)', async () => {
    ;(notifSvc.get_notificaciones_correctivos as any).mockResolvedValueOnce({
      data: [
        { id: 11, mensaje: 'Correctivo A', created_at: new Date().toISOString(), leida: false, id_mantenimiento: 101 },
        { id: 12, mensaje: 'Correctivo B', created_at: new Date().toISOString(), leida: true,  id_mantenimiento: 102 },
      ],
    })
    ;(notifSvc.get_notificaciones_preventivos as any).mockResolvedValueOnce({
      data: [
        { id: 21, mensaje: 'Preventivo A', created_at: new Date().toISOString(), leida: false, id_mantenimiento: 201 },
      ],
    })

    renderWithProviders()
    const dialog = await openNotifications()

    expect(within(dialog).getByText(/correctivo a/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/preventivo a/i)).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: /marcar todas como leídas/i }))

    await waitFor(() => {
      expect((notifSvc as any).correctivo_leido).toHaveBeenCalledWith(11)
      expect((notifSvc as any).correctivo_leido).not.toHaveBeenCalledWith(12)
      expect((notifSvc as any).preventivo_leido).toHaveBeenCalledWith(21)
    })
  })

  it('elimina sólo las notificaciones leídas', async () => {
    ;(notifSvc.get_notificaciones_correctivos as any).mockResolvedValueOnce({
      data: [
        { id: 31, mensaje: 'Correctivo leído',    created_at: new Date().toISOString(), leida: true,  id_mantenimiento: 301 },
        { id: 32, mensaje: 'Correctivo no leído', created_at: new Date().toISOString(), leida: false, id_mantenimiento: 302 },
      ],
    })
    ;(notifSvc.get_notificaciones_preventivos as any).mockResolvedValueOnce({ data: [] })

    renderWithProviders()
    const dialog = await openNotifications()

    await userEvent.click(within(dialog).getByRole('button', { name: /eliminar leídas/i }))

    await waitFor(() => {
      expect((notifSvc as any).delete_notificacion).toHaveBeenCalledTimes(1)
      expect((notifSvc as any).delete_notificacion).toHaveBeenCalledWith(31)
    })
  })

  it('cierra sesión desde el modal', async () => {
    ;(notifSvc.get_notificaciones_correctivos as any).mockResolvedValueOnce({ data: [] })
    ;(notifSvc.get_notificaciones_preventivos as any).mockResolvedValueOnce({ data: [] })

    const { authValue } = renderWithProviders()
    const dialog = await openNotifications()

    await userEvent.click(within(dialog).getByRole('button', { name: /cerrar sesión/i }))
    expect(authValue.logOut).toHaveBeenCalledTimes(1)
  })
})

it('elimina una notificación al clickear su X', async () => {
  (notifSvc.get_notificaciones_correctivos as any).mockResolvedValueOnce({
    data: [{ id: 99, mensaje: 'Notif X', created_at: new Date().toISOString(), leida: false, id_mantenimiento: 999 }],
  })
  ;(notifSvc.get_notificaciones_preventivos as any).mockResolvedValueOnce({ data: [] })

  renderWithProviders()
  const dialog = await openNotifications()

  const btnX = within(dialog).getByRole('button', { name: /eliminar notificación/i })
  await userEvent.click(btnX)

  await waitFor(() => {
    expect((notifSvc as any).delete_notificacion).toHaveBeenCalledWith(99)
  })
})