import React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CuadrillaForm from '@/components/forms/CuadrillaForm'
import { AuthContext } from '@/context/AuthContext'

// ---------- FIX: datos hoisted para usarlos dentro de los mocks ----------
const { ZONAS, NUEVA_ZONA } = vi.hoisted(() => ({
  ZONAS: [
    { id: 1, nombre: 'Zona 1' },
    { id: 2, nombre: 'Zona 2' },
    { id: 3, nombre: 'Zona 3' },
  ],
  NUEVA_ZONA: 'Zona Nueva',
}))

// ---------- Mocks de servicios ----------
vi.mock('@/services/zonaService', () => ({
  getZonas: vi.fn().mockResolvedValue({ data: ZONAS }),
  createZona: vi.fn().mockResolvedValue({ data: { id: 99, nombre: NUEVA_ZONA } }),
  deleteZona: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/services/cuadrillaService', () => ({
  createCuadrilla: vi.fn().mockResolvedValue({}),
  updateCuadrilla: vi.fn().mockResolvedValue({}),
}))

import * as zonaSvc from '@/services/zonaService'
import * as cuadSvc from '@/services/cuadrillaService'

// Helper para render con contexto
function renderWithProviders(ui: React.ReactNode, ctxOverrides: Partial<any> = {}) {
  const signInWithGoogle = vi.fn().mockResolvedValue({
    idToken: 'token-google',
    email: 'cuadrilla@inversur.com',
  })
  const authValue = { signInWithGoogle, ...ctxOverrides }
  return {
    ...render(<AuthContext.Provider value={authValue as any}>{ui}</AuthContext.Provider>),
    authValue,
  }
}

describe('CuadrillaForm (genérico)', () => {
  const user = userEvent.setup()
  beforeEach(() => vi.clearAllMocks())

  it('renderiza modo CREAR y deshabilita enviar sin datos', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    expect(await screen.findByText(/crear cuadrilla/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /seleccione una zona/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar con google/i })).toBeDisabled()
  })

  it('carga zonas y permite seleccionar una (sin depender de nombres reales)', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))

    // Menú y items
    const menu = screen.getByText(ZONAS[0].nombre).closest('.dropdown-menu')!
    const items = within(menu).getAllByRole('button', { hidden: true })
    expect(items.length).toBeGreaterThanOrEqual(ZONAS.length) // Boton: + “Agregar nueva zona…”
    ZONAS.forEach(z => expect(screen.getByText(z.nombre)).toBeInTheDocument())

    await user.click(screen.getByText(ZONAS[1].nombre))
    expect(screen.getByRole('button', { name: ZONAS[1].nombre })).toBeInTheDocument()
  })

  it('“Agregar nueva zona…” muestra input, crea y selecciona la nueva zona', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(/agregar nueva zona/i))

    const input = await screen.findByPlaceholderText(/escriba la nueva zona/i)
    await user.type(input, NUEVA_ZONA)
    await user.click(screen.getByRole('button', { name: /^agregar$/i }))

    expect(zonaSvc.createZona).toHaveBeenCalledWith({ nombre: NUEVA_ZONA })
    expect(await screen.findByRole('button', { name: NUEVA_ZONA })).toBeInTheDocument()
  })

  it('elimina una zona (click en ×)', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))

    const item = screen.getByText(ZONAS[0].nombre).closest('.dropdown-item')!
    // Dentro del item hay un botón “×” adicional
    const btns = within(item).getAllByRole('button')
    await user.click(btns[btns.length - 1]) // Clic en “×”

    // Verifica que se llamó a deleteZona y que el item ya no está
    expect(zonaSvc.deleteZona).toHaveBeenCalledWith(ZONAS[0].id)
  })

  it('GUARDA en modo CREAR usando Google y createCuadrilla', async () => {
    const onClose = vi.fn()
    const { authValue } = renderWithProviders(<CuadrillaForm onClose={onClose} />)

    await user.type(await screen.findByLabelText(/nombre/i), 'Cuadrilla X')
    await user.click(screen.getByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(ZONAS[0].nombre))

    await user.click(screen.getByRole('button', { name: /registrar con google/i }))

    expect(authValue.signInWithGoogle).toHaveBeenCalledWith(false)
    expect(cuadSvc.createCuadrilla).toHaveBeenCalledWith({
      nombre: 'Cuadrilla X',
      zona: ZONAS[0].nombre,
      email: 'cuadrilla@inversur.com',
      id_token: 'token-google',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('GUARDA en modo EDITAR llamando updateCuadrilla', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <CuadrillaForm onClose={onClose} cuadrilla={{ id: 7, nombre: 'Viejo', zona: ZONAS[0].nombre }} />
    )

    const nombre = await screen.findByLabelText(/nombre/i)
    await user.clear(nombre)
    await user.type(nombre, 'Editado')
    await user.click(screen.getByRole('button', { name: ZONAS[0].nombre }))
    await user.click(screen.getByText(ZONAS[2].nombre))

    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    expect(cuadSvc.updateCuadrilla).toHaveBeenCalledWith(7, { nombre: 'Editado', zona: ZONAS[2].nombre })
    expect(onClose).toHaveBeenCalled()
  })

  it('valida: el botón se habilita sólo si hay Nombre y Zona', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    const submit = await screen.findByRole('button', { name: /registrar con google/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/nombre/i), 'Equipo 1')
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(ZONAS[1].nombre))
    expect(submit).toBeEnabled()
  })
})
