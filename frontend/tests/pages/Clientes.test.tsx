import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Clientes from '../../src/pages/Clientes';
import useClientes from '../../src/hooks/forms/useClientes';

vi.mock('../../src/hooks/forms/useClientes');
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/ClienteForm', () => ({ default: (props: any) => <div data-testid="cliente-form">{props.cliente ? `edit-${props.cliente.id}` : 'nuevo'}</div> }));
vi.mock('../../src/components/forms/SucursalForm', () => ({ default: () => <div data-testid="sucursal-form">sucursal-form</div> }));
vi.mock('../../src/components/ColumnSelector', () => ({ default: (props: any) => <div data-testid="column-selector" data-columns={props.selectedColumns.join(',')} /> }));

const createHookState = (overrides: Record<string, any> = {}) => ({
  clientes: [{ id: 1, nombre: 'Cliente Demo', contacto: 'Laura', email: 'demo@acme.com' }],
  loading: false,
  error_cliente: null,
  error_sucursal: null,
  success_cliente: null,
  success_sucursal: null,
  showClienteForm: false,
  setShowClienteForm: vi.fn(),
  selectedCliente: null,
  expandedCliente: null,
  sucursalesMap: {},
  activeSucursalForm: null,
  setActiveSucursalForm: vi.fn(),
  loadingSucursales: false,
  selectedClientColumns: ['id', 'nombre', 'contacto', 'email', 'acciones'],
  selectedSucursalColumns: ['id', 'nombre', 'zona', 'direccion', 'frecuencia', 'acciones'],
  handleOpenClienteForm: vi.fn(),
  handleDeleteCliente: vi.fn(),
  handleClienteSaved: vi.fn(),
  toggleClienteRow: vi.fn(),
  handleOpenSucursalForm: vi.fn(),
  handleDeleteSucursal: vi.fn(),
  handleSucursalSaved: vi.fn(),
  handleSaveClientColumns: vi.fn(),
  handleSaveSucursalColumns: vi.fn(),
  setError_cliente: vi.fn(),
  setError_sucursal: vi.fn(),
  setSuccess_cliente: vi.fn(),
  setSuccess_sucursal: vi.fn(),
  ...overrides,
});

describe('P�gina de Clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useClientes).mockReturnValue(createHookState());
  });

  it('Deber�a mostrar un spinner cuando est� cargando', () => {
    vi.mocked(useClientes).mockReturnValue(createHookState({ loading: true }));

    render(<Clientes />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('Deber�a renderizar la tabla de clientes y los selectores de columnas', () => {
    render(<Clientes />);

    expect(screen.getByRole('heading', { name: /Clientes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nuevo Cliente/i })).toBeInTheDocument();
    expect(screen.getByText('Cliente Demo')).toBeInTheDocument();
    expect(screen.getAllByTestId('column-selector')).toHaveLength(2);
  });

  it('Deber�a llamar a handleOpenClienteForm al presionar el bot�n de nuevo cliente', () => {
    const hookState = createHookState();
    vi.mocked(useClientes).mockReturnValue(hookState);

    render(<Clientes />);

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Cliente/i }));
    expect(hookState.handleOpenClienteForm).toHaveBeenCalledWith(null);
  });

  it('Deber�a mostrar el formulario de cliente cuando showClienteForm es true', () => {
    vi.mocked(useClientes).mockReturnValue(
      createHookState({ showClienteForm: true, selectedCliente: { id: 2, nombre: 'ACME' } })
    );

    render(<Clientes />);

    expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
  });

  it('Deber�a mostrar las sucursales y permitir acciones cuando el cliente est� expandido', () => {
    const sucursal = { id: 10, nombre: 'Sucursal Norte', zona: 'Norte', direccion: 'Calle 1', frecuencia_preventivo: 'Mensual' };
    const hookState = createHookState({
      expandedCliente: 1,
      sucursalesMap: { 1: [sucursal] },
      activeSucursalForm: { clienteId: 1, sucursal },
    });
    vi.mocked(useClientes).mockReturnValue(hookState);

    render(<Clientes />);

    expect(screen.getByText(/Sucursales de Cliente Demo/i)).toBeInTheDocument();
    expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();
    expect(screen.getByTestId('sucursal-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Agregar sucursal/i }));
    expect(hookState.handleOpenSucursalForm).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText(/Ver Sucursales/i));
    expect(hookState.toggleClienteRow).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText(/Editar cliente/i));
    expect(hookState.handleOpenClienteForm).toHaveBeenCalledWith(hookState.clientes[0]);

    fireEvent.click(screen.getByLabelText(/Eliminar cliente/i));
    expect(hookState.handleDeleteCliente).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText(/Eliminar sucursal/i));
    expect(hookState.handleDeleteSucursal).toHaveBeenCalledWith(1, 10);
  });

  it('Deber�a mostrar los mensajes de error y �xito cuando el hook los provee', () => {
    vi.mocked(useClientes).mockReturnValue(
      createHookState({
        error_cliente: 'Error al cargar',
        success_cliente: 'Acci�n exitosa',
        error_sucursal: 'Fallo en sucursales',
        success_sucursal: 'Sucursal creada',
        expandedCliente: 1,
        sucursalesMap: { 1: [] },
      })
    );

    render(<Clientes />);

    expect(screen.getByText('Error al cargar')).toBeInTheDocument();
    expect(screen.getByText('Acci�n exitosa')).toBeInTheDocument();
    expect(screen.getByText('Fallo en sucursales')).toBeInTheDocument();
    expect(screen.getByText('Sucursal creada')).toBeInTheDocument();
  });
});
