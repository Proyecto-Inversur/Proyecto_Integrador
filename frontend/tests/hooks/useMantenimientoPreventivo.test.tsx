import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';

// Importo el hook a probar y sus dependencias para poder simularlas.
import useMantenimientoPreventivo from '../../src/hooks/forms/useMantenimientoPreventivo';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';

// --- Mocks ---
vi.mock('../../src/services/mantenimientoPreventivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('Hook: useMantenimientoPreventivo', () => {

  // Defino datos de prueba reutilizables.
  const mockMantenimientos = [
    { id: 1, id_sucursal: 101, id_cuadrilla: 1, fecha_cierre: null }, // Abierto para Cuadrilla 1
    { id: 2, id_sucursal: 102, id_cuadrilla: 2, fecha_cierre: null }, // Abierto para Cuadrilla 2
    { id: 3, id_sucursal: 103, id_cuadrilla: 1, fecha_cierre: '2025-10-10' }, // Cerrado para Cuadrilla 1
  ];
  const mockSucursales = [{ id: 101, nombre: 'Sucursal A', zona: 'Norte' }];
  const mockCuadrillas = [{ id: 1, nombre: 'Cuadrilla Alfa' }];
  const mockZonas = [{ id: 1, nombre: 'Norte' }];
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Limpio y reseteo todos los mocks antes de cada prueba.
    vi.clearAllMocks();
    vi.mocked(mantenimientoPreventivoService.getMantenimientosPreventivos).mockResolvedValue({ data: mockMantenimientos });
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursales });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillas });
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: mockZonas });
    vi.mocked(mantenimientoPreventivoService.deleteMantenimientoPreventivo).mockResolvedValue({});
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('Debería cargar todos los datos para un usuario/admin', async () => {
    // Simulo un usuario que es admin/user.
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 'admin1', isUser: true, isCuadrilla: false });
    
    const { result } = renderHook(() => useMantenimientoPreventivo());
    
    // El hook debe empezar en estado de carga.
    expect(result.current.isLoading).toBe(true);

    // Espero a que la carga termine.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verifico que el admin ve todos los mantenimientos.
    expect(mantenimientoPreventivoService.getMantenimientosPreventivos).toHaveBeenCalledTimes(1);
    expect(result.current.filteredMantenimientos).toHaveLength(3);
  });

  it('Debería filtrar los mantenimientos para un usuario de tipo cuadrilla (solo abiertos)', async () => {
    // Simulo un usuario que es cuadrilla, con id=1.
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1, isUser: false, isCuadrilla: true });

    const { result } = renderHook(() => useMantenimientoPreventivo());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verifico que la lista solo contenga el mantenimiento ABIERTO de la cuadrilla 1.
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id).toBe(1);
    expect(result.current.filteredMantenimientos[0].fecha_cierre).toBeNull();
  });

  it('Debería filtrar la lista de mantenimientos al cambiar un filtro', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true });
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simulo un cambio en el filtro de cuadrilla.
    const mockEvent = { target: { name: 'cuadrilla', value: '2' } };
    act(() => {
      result.current.handleFilterChange(mockEvent);
    });

    // Verifico que la lista ahora solo contiene el mantenimiento de la cuadrilla 2.
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id_cuadrilla).toBe(2);
  });

  it('Debería llamar a deleteMantenimientoPreventivo y recargar los datos', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true });
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simulo la acción de eliminar.
    await act(async () => {
      await result.current.handleDelete(1);
    });

    // Verifico que se llamó al servicio de borrado y se recargaron los datos.
    expect(mantenimientoPreventivoService.deleteMantenimientoPreventivo).toHaveBeenCalledWith(1);
    expect(mantenimientoPreventivoService.getMantenimientosPreventivos).toHaveBeenCalledTimes(2); // 1 inicial + 1 recarga
  });

  it('Debería llamar a navigate al hacer clic en una fila', async () => {
    const { result } = renderHook(() => useMantenimientoPreventivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const mantenimientoIdParaNavegar = 456;
    act(() => {
        result.current.handleRowClick(mantenimientoIdParaNavegar);
    });

    // Verifico que se llamó a la función de navegación con los parámetros correctos.
    expect(mockNavigate).toHaveBeenCalledWith('/preventivo', {
        state: { mantenimientoId: mantenimientoIdParaNavegar },
    });
  });
});