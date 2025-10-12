import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Hoisted datos de prueba para usar dentro de las fábricas vi.mock
const { PREVENTIVOS, CUADRILLAS, SUCURSALES, NUEVO_PREVENTIVO_DATA, MANTENIMIENTO_EXISTENTE } = vi.hoisted(() => ({
  PREVENTIVOS: [
    { id: 1, id_sucursal: 101, nombre_sucursal: 'Sucursal A', frecuencia: 'Mensual' },
    { id: 2, id_sucursal: 102, nombre_sucursal: 'Sucursal B', frecuencia: 'Trimestral' },
  ],
  CUADRILLAS: [
    { id: 1, nombre: 'Cuadrilla 1' },
    { id: 2, nombre: 'Cuadrilla 2' },
  ],
  SUCURSALES: [
    { id: 101, nombre: 'Sucursal A' },
    { id: 102, nombre: 'Sucursal B' },
    { id: 103, nombre: 'Sucursal C' },
  ],
  NUEVO_PREVENTIVO_DATA: { id_sucursal: 103, nombre_sucursal: 'Sucursal C', frecuencia: 'Semestral' },
  MANTENIMIENTO_EXISTENTE: {
    id: 5,
    id_sucursal: 102,
    frecuencia: 'Trimestral',
    id_cuadrilla: 1,
    fecha_apertura: '2025-10-05T00:00:00',
    estado: 'Pendiente',
  },
}))

// ---------- Mocks hoisted de servicios (evita ReferenceError por hoisting) ----------
const { createMantenimientoPreventivo, updateMantenimientoPreventivo } = vi.hoisted(() => ({
  createMantenimientoPreventivo: vi.fn(),
  updateMantenimientoPreventivo: vi.fn(),
}))
vi.mock('../../src/services/mantenimientoPreventivoService', () => ({
  createMantenimientoPreventivo,
  updateMantenimientoPreventivo,
}))

const { getPreventivos, createPreventivo, deletePreventivo, updatePreventivo } = vi.hoisted(() => ({
  getPreventivos: vi.fn().mockResolvedValue({ data: PREVENTIVOS }),
  createPreventivo: vi.fn(),
  deletePreventivo: vi.fn(),
  updatePreventivo: vi.fn(),
}))
vi.mock('../../src/services/preventivoService', () => ({
  getPreventivos,
  createPreventivo,
  deletePreventivo,
  updatePreventivo,
}))

const { getCuadrillas } = vi.hoisted(() => ({
  getCuadrillas: vi.fn().mockResolvedValue({ data: CUADRILLAS }),
}))
vi.mock('../../src/services/cuadrillaService', () => ({
  getCuadrillas,
}))

const { getSucursales } = vi.hoisted(() => ({
  getSucursales: vi.fn().mockResolvedValue({ data: SUCURSALES }),
}))
vi.mock('../../src/services/sucursalService', () => ({
  getSucursales,
}))

// Mock simple para Dropdown de react-bootstrap (mantener resto de componentes reales)
vi.mock('react-bootstrap', async (importOriginal) => {
  const actual = await importOriginal()
  const MockDropdown = ({ children, onToggle, show }) => (
    <div data-testid="dropdown-mock" onClick={() => onToggle && onToggle(!show)}>
      {children}
    </div>
  )
  MockDropdown.Toggle = ({ children, ...props }) => (
    <button data-testid="dropdown-toggle" type="button" {...props}>
      {children}
    </button>
  )
  MockDropdown.Menu = ({ children }) => <div data-testid="dropdown-menu-mock">{children}</div>
  MockDropdown.Item = ({ children, onClick, as: As = 'div', ...props }) => (
    <As data-testid="dropdown-item-mock" onClick={onClick} role="button" {...props}>
      {children}
    </As>
  )
  return {
    ...actual,
    Dropdown: MockDropdown,
  }
})

// Importamos el componente después de configurar los mocks
import MantenimientoPreventivoForm from '../../src/components/forms/MantenimientoPreventivoForm'

describe('MantenimientoPreventivoForm', () => {
  let user: ReturnType<typeof userEvent.setup>
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    // asegurar valor por defecto del mock asíncrono
    getPreventivos.mockResolvedValue({ data: PREVENTIVOS })
    getCuadrillas.mockResolvedValue({ data: CUADRILLAS })
    getSucursales.mockResolvedValue({ data: SUCURSALES })
  })

  it('renderiza en modo CREAR, carga datos y deshabilita el Guardar inicialmente', async () => {
    render(<MantenimientoPreventivoForm onClose={mockOnClose} />)

    expect(screen.getByText('Crear Mantenimiento Preventivo')).toBeInTheDocument()
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())
    const saveButton = screen.getByRole('button', { name: /guardar/i })
    expect(saveButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /Seleccione un preventivo|Seleccione un preventivo/i })).toBeInTheDocument()
  })

  it('renderiza en modo EDITAR y precarga los datos del mantenimiento', async () => {
    render(<MantenimientoPreventivoForm mantenimiento={MANTENIMIENTO_EXISTENTE} onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    expect(screen.getByText('Editar Mantenimiento Preventivo')).toBeInTheDocument()
    // el display del preventivo se arma a partir de preventivos cargados (nombre_sucursal - frecuencia)
    expect(screen.getByRole('button', { name: 'Sucursal B - Trimestral' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Cuadrilla/i)).toHaveValue('1')
    expect(screen.getByLabelText(/Fecha Apertura/i)).toHaveValue('2025-10-05')
  })

  it('GUARDA en modo CREAR y llama a createMantenimientoPreventivo con payload correcto', async () => {
    createMantenimientoPreventivo.mockResolvedValue({})
    render(<MantenimientoPreventivoForm onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    // abrir dropdown y seleccionar primer preventivo
    await user.click(screen.getByTestId('dropdown-toggle'))
    await user.click(screen.getByText('Sucursal A - Mensual'))

    // completar cuadrilla y fecha
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '2')
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-12-01')

    // enviar
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(createMantenimientoPreventivo).toHaveBeenCalledWith({
        id_sucursal: 101,
        frecuencia: 'Mensual',
        id_cuadrilla: 2,
        fecha_apertura: '2025-12-01',
        estado: 'Pendiente',
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  it('GUARDA en modo EDITAR y llama a updateMantenimientoPreventivo', async () => {
    updateMantenimientoPreventivo.mockResolvedValue({})
    render(<MantenimientoPreventivoForm mantenimiento={MANTENIMIENTO_EXISTENTE} onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    // cambiar cuadrilla
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '2')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(updateMantenimientoPreventivo).toHaveBeenCalledWith(MANTENIMIENTO_EXISTENTE.id, {
        id_sucursal: 102,
        frecuencia: 'Trimestral',
        id_cuadrilla: 2,
        fecha_apertura: '2025-10-05',
        estado: 'Pendiente',
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  it('permite AGREGAR un nuevo preventivo y lo selecciona automáticamente', async () => {
    const newPreventivoResponse = { id: 3, ...NUEVO_PREVENTIVO_DATA }
    createPreventivo.mockResolvedValue({ data: newPreventivoResponse })

    render(<MantenimientoPreventivoForm onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    await user.click(screen.getByTestId('dropdown-toggle'))
    await user.click(screen.getByText(/Agregar nuevo preventivo/i))

    const sucursalSelect = screen.getByRole('combobox', { name: /Seleccione una sucursal/i })
    const frecuenciaSelect = screen.getByRole('combobox', { name: /Seleccione una frecuencia/i })

    await user.selectOptions(sucursalSelect, '103')
    await user.selectOptions(frecuenciaSelect, 'Semestral')
    await user.click(screen.getByRole('button', { name: /Agregar/i }))

    await waitFor(() => {
      expect(createPreventivo).toHaveBeenCalledWith(NUEVO_PREVENTIVO_DATA)
    })

    expect(screen.getByRole('button', { name: 'Sucursal C - Semestral' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Agregar/i })).not.toBeInTheDocument()
  })

  it('permite EDITAR un preventivo existente', async () => {
    const updatedPreventivo = { id: 1, id_sucursal: 101, nombre_sucursal: 'Sucursal A', frecuencia: 'Cuatrimestral' }
    updatePreventivo.mockResolvedValue({ data: updatedPreventivo })

    render(<MantenimientoPreventivoForm onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    await user.click(screen.getByTestId('dropdown-toggle'))
    await user.click(screen.getAllByTitle('Editar')[0])

    const frecuenciaSelect = screen.getByRole('combobox', { name: /Seleccione una frecuencia/i })
    await user.selectOptions(frecuenciaSelect, 'Cuatrimestral')
    await user.click(screen.getByRole('button', { name: /Actualizar/i }))

    await waitFor(() => {
      expect(updatePreventivo).toHaveBeenCalledWith(1, {
        id_sucursal: 101,
        nombre_sucursal: 'Sucursal A',
        frecuencia: 'Cuatrimestral',
      })
    })
    expect(screen.getByRole('button', { name: 'Sucursal A - Cuatrimestral' })).toBeInTheDocument()
  })

  it('permite ELIMINAR un preventivo', async () => {
    deletePreventivo.mockResolvedValue({})

    render(<MantenimientoPreventivoForm onClose={mockOnClose} />)
    await waitFor(() => expect(getPreventivos).toHaveBeenCalled())

    await user.click(screen.getByTestId('dropdown-toggle'))
    await user.click(screen.getAllByTitle('Eliminar')[0])

    await waitFor(() => {
      expect(deletePreventivo).toHaveBeenCalledWith(1)
    })

    expect(screen.queryByText('Sucursal A - Mensual')).not.toBeInTheDocument()
  })
})