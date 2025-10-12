// tests/components/MantenimientoCorrectivoForm.test.tsx
import React from 'react'
import { act } from 'react-dom/test-utils'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─────────────────── Mock de transiciones (evita warnings de act) ───────────────────
vi.mock('react-transition-group', () => {
  const Fake = ({ children }: any) =>
    typeof children === 'function' ? children(true) : children
  return { Transition: Fake, CSSTransition: Fake }
})

// ─────────────────────────────── Mocks de servicios ───────────────────────────────
vi.mock('../../src/services/sucursalService', () => ({
  getSucursales: vi.fn().mockResolvedValue({
    data: [
      { id: 101, nombre: 'Sucursal A' },
      { id: 102, nombre: 'Sucursal B' },
    ],
  }),
}))
vi.mock('../../src/services/cuadrillaService', () => ({
  getCuadrillas: vi.fn().mockResolvedValue({
    data: [
      { id: 201, nombre: 'Cuadrilla 1' },
      { id: 202, nombre: 'Cuadrilla 2' },
    ],
  }),
}))
vi.mock('../../src/services/mantenimientoCorrectivoService', () => ({
  createMantenimientoCorrectivo: vi.fn().mockResolvedValue({}),
  updateMantenimientoCorrectivo: vi.fn().mockResolvedValue({}),
}))

// IMPORTS que dependen de los mocks — deben ir *después* de vi.mock
import MantenimientoCorrectivoForm from '../../src/components/forms/MantenimientoCorrectivoForm'
import * as mcSvc from '../../src/services/mantenimientoCorrectivoService'

describe('MantenimientoCorrectivoForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  it('renderiza modo CREAR y deja "Guardar" deshabilitado sin datos', async () => {
    render(<MantenimientoCorrectivoForm onClose={vi.fn()} />)

    expect(await screen.findByText(/crear mantenimiento correctivo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sucursal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cuadrilla/i)).toBeInTheDocument()

    const guardar = await screen.findByRole('button', { name: /guardar/i })
    expect(guardar).toBeDisabled()
  })

  it('crea un mantenimiento cuando se completan obligatorios y se envía', async () => {
    const onClose = vi.fn()
    render(<MantenimientoCorrectivoForm onClose={onClose} />)

    await act(async () => {
      const selSucursal = await screen.findByLabelText(/sucursal/i)
      const selCuadrilla = await screen.findByLabelText(/cuadrilla/i)

      await user.selectOptions(selSucursal, '102')
      await user.selectOptions(selCuadrilla, '201')
      await user.type(await screen.findByLabelText(/fecha apertura/i), '2025-08-11')
      await user.type(screen.getByLabelText(/número de caso/i), '123')
      await user.type(screen.getByLabelText(/^incidente/i), 'A')
      await user.selectOptions(screen.getByLabelText(/^rubro/i), 'Mobiliario')

      const guardar = await screen.findByRole('button', { name: /guardar/i })
      expect(guardar).toBeEnabled()
      await user.click(guardar)
    })

    await waitFor(() => {
      expect(mcSvc.createMantenimientoCorrectivo).toHaveBeenCalled()
      const callArgs = (mcSvc.createMantenimientoCorrectivo as unknown as vi.Mock).mock.calls[0] || []
      const payload = callArgs.length === 1 ? callArgs[0] : callArgs[1]
      expect(String(payload.id_sucursal)).toBe('102')
      expect(String(payload.id_cuadrilla)).toBe('201')
      expect(payload.fecha_apertura).toBe('2025-08-11')
      expect(payload.numero_caso).toBe('123')
      expect(payload.incidente).toBe('A')
      expect(payload.rubro).toBe('Mobiliario')
      expect(payload.estado).toBe('Pendiente')
      expect(payload.prioridad).toBe('Media')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('edita un mantenimiento y llama update con el payload actualizado (acepta id num/string)', async () => {
    const onClose = vi.fn()
    const mantenimiento = {
      id: 7,
      id_sucursal: 101,
      id_cuadrilla: 201,
      fecha_apertura: '2025-08-09T00:00:00',
      numero_caso: '101',
      incidente: '1',
      rubro: 'Mobiliario',
      estado: 'Presupuestado',
      prioridad: 'Baja',
    }

    render(<MantenimientoCorrectivoForm onClose={onClose} mantenimiento={mantenimiento} />)

    expect(await screen.findByText(/editar mantenimiento correctivo/i)).toBeInTheDocument()

    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/sucursal/i), '102')
      const nro = screen.getByLabelText(/número de caso/i)
      await user.clear(nro)
      await user.type(nro, '999')
      await user.selectOptions(screen.getByLabelText(/^rubro/i), 'Techos')
      await user.selectOptions(screen.getByLabelText(/^estado/i), 'En Progreso')
      await user.selectOptions(screen.getByLabelText(/^prioridad/i), 'Alta')
      const fecha = screen.getByLabelText(/fecha apertura/i)
      await user.clear(fecha)
      await user.type(fecha, '2025-08-10')
      const guardarBtn = await screen.findByRole('button', { name: /guardar/i })
      await user.click(guardarBtn)
    })

    await waitFor(() => {
      expect((mcSvc.updateMantenimientoCorrectivo as unknown as vi.Mock).mock.calls.length).toBeGreaterThan(0)
      const [[calledId, payload]] = (mcSvc.updateMantenimientoCorrectivo as unknown as vi.Mock).mock.calls
      expect(calledId).toBe(7)
      expect(String(payload.id_sucursal)).toBe('102')
      expect(String(payload.id_cuadrilla)).toBe('201')
      expect(payload.fecha_apertura).toBe('2025-08-10')
      expect(payload.numero_caso).toBe('999')
      expect(payload.incidente).toBe('1')
      expect(payload.rubro).toBe('Techos')
      expect(payload.estado).toBe('En Progreso')
      expect(payload.prioridad).toBe('Alta')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('muestra error y no envía si faltan obligatorios (sin depender del texto del error)', async () => {
    render(<MantenimientoCorrectivoForm onClose={vi.fn()} />)

    await act(async () => {
      await user.selectOptions(await screen.findByLabelText(/sucursal/i), '101')
      await user.selectOptions(await screen.findByLabelText(/cuadrilla/i), '201')
      await user.type(screen.getByLabelText(/fecha apertura/i), '2025-08-11')
      await user.type(screen.getByLabelText(/número de caso/i), '555')
      await user.type(screen.getByLabelText(/^incidente/i), 'B')
      // NO seleccione rubro intencionalmente
      await user.click(await screen.findByRole('button', { name: /guardar/i }))
    })

    await waitFor(() => {
      expect(mcSvc.createMantenimientoCorrectivo).not.toHaveBeenCalled()
    })
  })

  it('habilita el botón Guardar sólo al completar los campos obligatorios', async () => {
    render(<MantenimientoCorrectivoForm onClose={vi.fn()} />)
    const guardar = await screen.findByRole('button', { name: /guardar/i })
    expect(guardar).toBeDisabled()

    await act(async () => {
      await user.selectOptions(await screen.findByLabelText(/sucursal/i), '101')
      await user.type(screen.getByLabelText(/fecha apertura/i), '2025-08-11')
      await user.type(screen.getByLabelText(/número de caso/i), '42')
      await user.type(screen.getByLabelText(/^incidente/i), 'C')
      await user.selectOptions(screen.getByLabelText(/^rubro/i), 'Otros')
    })

    expect(guardar).toBeEnabled()
  })

  it('carga las opciones de sucursal y cuadrilla desde los servicios mockeados', async () => {
    render(<MantenimientoCorrectivoForm onClose={vi.fn()} />)

    expect(await screen.findByRole('option', { name: /Sucursal A/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Sucursal B/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Cuadrilla 1/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Cuadrilla 2/i })).toBeInTheDocument()
  })

  it('simula petición en curso y verifica llamado y cierre al resolverse', async () => {
    let resolver: () => void = () => {}
    const pending = new Promise<void>((res) => {
      resolver = res
    })
    ;(mcSvc.createMantenimientoCorrectivo as unknown as vi.Mock).mockImplementation(() => pending)

    const onClose = vi.fn()
    render(<MantenimientoCorrectivoForm onClose={onClose} />)

    await act(async () => {
      await user.selectOptions(await screen.findByLabelText(/sucursal/i), '102')
      await user.selectOptions(await screen.findByLabelText(/cuadrilla/i), '201')
      await user.type(await screen.findByLabelText(/fecha apertura/i), '2025-08-11')
      await user.type(screen.getByLabelText(/número de caso/i), '321')
      await user.type(screen.getByLabelText(/^incidente/i), 'Z')
      await user.selectOptions(screen.getByLabelText(/^rubro/i), 'Mobiliario')
      const guardar = await screen.findByRole('button', { name: /guardar/i })
      await user.click(guardar)
    })

    await waitFor(() => {
      expect((mcSvc.createMantenimientoCorrectivo as unknown as vi.Mock).mock.calls.length).toBeGreaterThan(0)
    })

    act(() => resolver())
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('no intenta crear cuando falta un campo obligatorio (comprobación adicional)', async () => {
    render(<MantenimientoCorrectivoForm onClose={vi.fn()} />)

    await act(async () => {
      await user.selectOptions(await screen.findByLabelText(/sucursal/i), '101')
      // dejar cuadrilla vacía intencionalmente
      await user.type(await screen.findByLabelText(/fecha apertura/i), '2025-09-01')
      await user.type(screen.getByLabelText(/número de caso/i), '777')
      await user.type(screen.getByLabelText(/^incidente/i), 'X')
      await user.selectOptions(screen.getByLabelText(/^rubro/i), 'Otros')
      await user.click(await screen.findByRole('button', { name: /guardar/i }))
    })

    await waitFor(() => {
      expect(mcSvc.createMantenimientoCorrectivo).not.toHaveBeenCalled()
    })
  })
})
