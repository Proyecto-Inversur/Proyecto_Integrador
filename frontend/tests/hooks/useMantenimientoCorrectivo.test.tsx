import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';
import useMantenimientoCorrectivo from '../../src/hooks/forms/useMantenimientoCorrectivo';
import * as mantenimientoCorrectivoService from '../../src/services/mantenimientoCorrectivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import * as clienteService from '../../src/services/clienteService';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';

vi.mock('../../src/services/mantenimientoCorrectivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/clienteService');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('Hook: useMantenimientoCorrectivo', () => {
  const mockMantenimientos = [
    { id: 1, id_sucursal: 101, id_cuadrilla: 1, estado: 'Pendiente', fecha_apertura: '2025-10-10' },
    { id: 2, id_sucursal: 102, id_cuadrilla: 2, estado: 'En Progreso', fecha_apertura: '2025-10-12' },
    { id: 3, id_sucursal: 103, id_cuadrilla: 1, estado: 'Finalizado', fecha_apertura: '2025-10-01' },
  ];
  const mockSucursales = [{ id: 101, nombre: 'Sucursal A', zona: 'Norte' }];
  const mockCuadrillas = [{ id: 1, nombre: 'Cuadrilla Alfa' }];
  const mockZonas = [{ id: 1, nombre: 'Norte' }];
  const mockClientes = [{ id: 1, nombre: 'Cliente Demo' }];
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mantenimientoCorrectivoService.getMantenimientosCorrectivos).mockResolvedValue({ data: mockMantenimientos });
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursales });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillas });
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: mockZonas });
    vi.mocked(clienteService.getClientes).mockResolvedValue({ data: mockClientes });
    vi.mocked(mantenimientoCorrectivoService.deleteMantenimientoCorrectivo).mockResolvedValue({});
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const waitForLoad = async () => {
    await waitFor(() => expect(mantenimientoCorrectivoService.getMantenimientosCorrectivos).toHaveBeenCalled());
  };

  it('Deber�a cargar todos los datos iniciales para un usuario/admin', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 'admin1', isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoCorrectivo());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filteredMantenimientos).toHaveLength(3);
    expect(result.current.sucursales).toEqual(mockSucursales);
    expect(result.current.clientes).toEqual(mockClientes);
  });

  it('Deber�a filtrar los mantenimientos para un usuario cuadrilla', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1, isUser: false, isCuadrilla: true });
    const { result } = renderHook(() => useMantenimientoCorrectivo());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id).toBe(1);
  });

  it('Deber�a filtrar la lista al cambiar un filtro', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitForLoad();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleFilterChange({ target: { name: 'estado', value: 'En Progreso' } } as any);
    });

    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].estado).toBe('En Progreso');
  });

  it('Deber�a llamar a deleteMantenimientoCorrectivo y recargar los datos', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mantenimientoCorrectivoService.deleteMantenimientoCorrectivo).toHaveBeenCalledWith(1);
    expect(mantenimientoCorrectivoService.getMantenimientosCorrectivos).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it('Deber�a navegar al hacer clic en una fila', async () => {
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleRowClick(123);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/correctivo', { state: { mantenimientoId: 123 } });
  });

  it('Deber�a calcular correctamente nombres auxiliares', async () => {
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.getSucursalNombre(101)).toBe('Sucursal A');
    expect(result.current.getCuadrillaNombre(1)).toBe('Cuadrilla Alfa');
    expect(result.current.getZonaNombre(101)).toBe('Norte');
    expect(result.current.getClienteNombre(1)).toBe('Cliente Demo');
    expect(result.current.getSucursalNombre(999)).toBe('Desconocida');
  });
});

