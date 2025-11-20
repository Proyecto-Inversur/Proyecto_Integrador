import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';
import useMantenimientoPreventivo from '../../src/hooks/forms/useMantenimientoPreventivo';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import * as clienteService from '../../src/services/clienteService';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';

vi.mock('../../src/services/mantenimientoPreventivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/clienteService');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('Hook: useMantenimientoPreventivo', () => {
  const mockMantenimientos = [
    { id: 1, id_sucursal: 101, id_cuadrilla: 1, fecha_cierre: null, cliente_id: 1 },
    { id: 2, id_sucursal: 102, id_cuadrilla: 2, fecha_cierre: null, cliente_id: 2 },
    { id: 3, id_sucursal: 103, id_cuadrilla: 1, fecha_cierre: '2025-10-10', cliente_id: 1 },
  ];
  const mockSucursales = [{ id: 101, nombre: 'Sucursal A', zona: 'Norte' }];
  const mockCuadrillas = [{ id: 1, nombre: 'Cuadrilla Alfa' }];
  const mockZonas = [{ id: 1, nombre: 'Norte' }];
  const mockClientes = [{ id: 1, nombre: 'Cliente Uno' }];
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mantenimientoPreventivoService.getMantenimientosPreventivos).mockResolvedValue({ data: mockMantenimientos });
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursales });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillas });
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: mockZonas });
    vi.mocked(clienteService.getClientes).mockResolvedValue({ data: mockClientes });
    vi.mocked(mantenimientoPreventivoService.deleteMantenimientoPreventivo).mockResolvedValue({});
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('Deber�a cargar todos los datos para un usuario/admin', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 'admin1', isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoPreventivo());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filteredMantenimientos).toHaveLength(3);
    expect(result.current.clientes).toEqual(mockClientes);
  });

  it('Deber�a filtrar los mantenimientos para una cuadrilla (solo abiertos)', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1, isUser: false, isCuadrilla: true });
    const { result } = renderHook(() => useMantenimientoPreventivo());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id).toBe(1);
  });

  it('Deber�a filtrar la lista al cambiar un filtro', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleFilterChange({ target: { name: 'cuadrilla', value: '2' } } as any);
    });

    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id_cuadrilla).toBe(2);
  });

  it('Deber�a eliminar un mantenimiento y recargar los datos', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mantenimientoPreventivoService.deleteMantenimientoPreventivo).toHaveBeenCalledWith(1);
    expect(mantenimientoPreventivoService.getMantenimientosPreventivos).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it('Deber�a navegar al seleccionar un mantenimiento', async () => {
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleRowClick(456);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/preventivo', { state: { mantenimientoId: 456 } });
  });
});

