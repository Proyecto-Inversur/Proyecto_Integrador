import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useClientes from '../../src/hooks/forms/useClientes';
import * as clienteService from '../../src/services/clienteService';
import * as sucursalService from '../../src/services/sucursalService';
import * as preferencesService from '../../src/services/preferencesService';

vi.mock('../../src/services/clienteService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/preferencesService');

const mockClientes = [
  { id: 1, nombre: 'Cliente Demo', contacto: 'Laura', email: 'demo@acme.com' },
];

const mockSucursales = [
  { id: 10, nombre: 'Sucursal Centro', zona: 'Norte', direccion: 'Calle 1', frecuencia_preventivo: 'Mensual' },
];

const CLIENT_PREF_KEY = 'clientes_table';
const SUCURSAL_PREF_KEY = 'clientes_sucursales_table';

describe('Hook: useClientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clienteService.getClientes).mockResolvedValue({ data: mockClientes });
    vi.mocked(clienteService.deleteCliente).mockResolvedValue({});
    vi.mocked(clienteService.createCliente).mockResolvedValue({});
    vi.mocked(clienteService.updateCliente).mockResolvedValue({});

    vi.mocked(sucursalService.getSucursalesByCliente).mockResolvedValue({ data: mockSucursales });
    vi.mocked(sucursalService.deleteSucursal).mockResolvedValue({});

    vi.mocked(preferencesService.getColumnPreferences).mockImplementation(async (key: string) => {
      if (key === CLIENT_PREF_KEY) {
        return { data: { columns: ['id', 'nombre', 'email'] } };
      }
      if (key === SUCURSAL_PREF_KEY) {
        return { data: { columns: ['id', 'nombre', 'zona', 'direccion'] } };
      }
      return { data: { columns: [] } };
    });
    vi.mocked(preferencesService.saveColumnPreferences).mockResolvedValue({});
  });

  it('Deber�a cargar clientes y preferencias al inicializarse', async () => {
    const { result } = renderHook(() => useClientes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(clienteService.getClientes).toHaveBeenCalledTimes(1);
    expect(result.current.clientes).toEqual(mockClientes);
    expect(result.current.selectedClientColumns).toEqual(['id', 'nombre', 'email']);
    expect(result.current.selectedSucursalColumns).toEqual(['id', 'nombre', 'zona', 'direccion']);
  });

  it('Deber�a expandir un cliente y cargar sus sucursales si no existen en cach�', async () => {
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.toggleClienteRow(1);
    });

    await waitFor(() => {
      expect(sucursalService.getSucursalesByCliente).toHaveBeenCalledWith(1);
      expect(result.current.sucursalesMap[1]).toEqual(mockSucursales);
    });

    act(() => {
      result.current.toggleClienteRow(1);
    });

    expect(result.current.expandedCliente).toBeNull();
  });

  it('Deber�a eliminar un cliente y recargar la lista cuando se confirma el di�logo', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteCliente(1);
    });

    expect(clienteService.deleteCliente).toHaveBeenCalledWith(1);
    expect(clienteService.getClientes).toHaveBeenCalledTimes(2);
    expect(result.current.success_cliente).toBe('Cliente eliminado correctamente');

    confirmSpy.mockRestore();
  });

  it('No deber�a eliminar un cliente cuando se cancela el di�logo de confirmaci�n', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleDeleteCliente(1);
    });

    expect(clienteService.deleteCliente).not.toHaveBeenCalled();
    expect(clienteService.getClientes).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('Deber�a eliminar una sucursal y recargar la lista correspondiente', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteSucursal(1, 10);
    });

    expect(sucursalService.deleteSucursal).toHaveBeenCalledWith(10);
    expect(sucursalService.getSucursalesByCliente).toHaveBeenCalledWith(1);
    expect(result.current.success_sucursal).toBe('Sucursal eliminada correctamente');
    confirmSpy.mockRestore();
  });

  it('Deber�a guardar las preferencias de columnas seleccionadas', async () => {
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSaveClientColumns(['id', 'nombre']);
    });

    expect(preferencesService.saveColumnPreferences).toHaveBeenCalledWith(CLIENT_PREF_KEY, ['id', 'nombre']);
    expect(result.current.selectedClientColumns).toEqual(['id', 'nombre']);

    await act(async () => {
      await result.current.handleSaveSucursalColumns(['id', 'zona']);
    });

    expect(preferencesService.saveColumnPreferences).toHaveBeenCalledWith(SUCURSAL_PREF_KEY, ['id', 'zona']);
    expect(result.current.selectedSucursalColumns).toEqual(['id', 'zona']);
  });

  it('Deber�a gestionar la apertura del formulario y recargar los datos al guardar', async () => {
    const { result } = renderHook(() => useClientes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleOpenClienteForm(mockClientes[0]);
    });

    expect(result.current.showClienteForm).toBe(true);
    expect(result.current.selectedCliente).toEqual(mockClientes[0]);

    act(() => {
      result.current.handleClienteSaved();
    });

    await waitFor(() => expect(clienteService.getClientes).toHaveBeenCalledTimes(2));
    expect(result.current.showClienteForm).toBe(false);
    expect(result.current.selectedCliente).toBeNull();
  });
});

