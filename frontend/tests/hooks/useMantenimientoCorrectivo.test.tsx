import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';

// Importo el hook a probar y sus dependencias para poder simularlas
import useMantenimientoCorrectivo from '../../src/hooks/forms/useMantenimientoCorrectivo';
import * as mantenimientoCorrectivoService from '../../src/services/mantenimientoCorrectivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';

// --- Mocks ---
vi.mock('../../src/services/mantenimientoCorrectivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('Hook: useMantenimientoCorrectivo', () => {

  // Defino datos de prueba reutilizables
  const mockMantenimientos = [
    { id: 1, id_sucursal: 101, id_cuadrilla: 1, estado: 'Pendiente', fecha_apertura: '2025-10-10' },
    { id: 2, id_sucursal: 102, id_cuadrilla: 2, estado: 'En Progreso', fecha_apertura: '2025-10-12' },
    { id: 3, id_sucursal: 103, id_cuadrilla: 1, estado: 'Finalizado', fecha_apertura: '2025-10-01' }, // Este debe ser filtrado para cuadrilla
  ];
  const mockSucursales = [{ id: 101, nombre: 'Sucursal A', zona: 'Norte' }];
  const mockCuadrillas = [{ id: 1, nombre: 'Cuadrilla Alfa' }];
  const mockZonas = [{ id: 1, nombre: 'Norte' }];
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuro respuestas por defecto para los mocks
    vi.mocked(mantenimientoCorrectivoService.getMantenimientosCorrectivos).mockResolvedValue({ data: mockMantenimientos });
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursales });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillas });
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: mockZonas });
    vi.mocked(mantenimientoCorrectivoService.deleteMantenimientoCorrectivo).mockResolvedValue({});
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('Debería cargar todos los datos iniciales para un usuario/admin', async () => {
    // Simulo un usuario que no es cuadrilla
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 'admin1', isUser: true, isCuadrilla: false });
    
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    
    // El hook debe empezar en estado de carga
    expect(result.current.isLoading).toBe(true);

    // Espero a que todas las llamadas asíncronas y actualizaciones de estado terminen
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verifico que los datos cargados sean los correctos y completos
    expect(mantenimientoCorrectivoService.getMantenimientosCorrectivos).toHaveBeenCalledTimes(1);
    expect(result.current.filteredMantenimientos).toHaveLength(3); // El admin ve todos
    expect(result.current.sucursales).toEqual(mockSucursales);
  });

  it('Debería filtrar los mantenimientos para un usuario de tipo cuadrilla', async () => {
    // Simulo un usuario que SÍ es cuadrilla, con id=1
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1, isUser: false, isCuadrilla: true });

    const { result } = renderHook(() => useMantenimientoCorrectivo());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verifico que la lista solo contenga el mantenimiento pendiente de la cuadrilla 1
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].id).toBe(1);
    expect(result.current.filteredMantenimientos[0].estado).toBe('Pendiente');
  });

  it('Debería filtrar la lista de mantenimientos al cambiar un filtro', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true, isCuadrilla: false });
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simulo un cambio en el filtro de estado
    const mockEvent = { target: { name: 'estado', value: 'En Progreso' } };
    act(() => {
      result.current.handleFilterChange(mockEvent);
    });

    // Verifico que la lista filtrada solo contenga el mantenimiento "En Progreso"
    expect(result.current.filteredMantenimientos).toHaveLength(1);
    expect(result.current.filteredMantenimientos[0].estado).toBe('En Progreso');
  });

  it('Debería llamar a deleteMantenimientoCorrectivo y recargar los datos', async () => {
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ isUser: true });
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false)); // Espera la carga inicial

    // Simulo la acción de eliminar
    await act(async () => {
      await result.current.handleDelete(1);
    });

    // Verifico que se llamó al servicio de borrado y se recargaron los datos
    expect(mantenimientoCorrectivoService.deleteMantenimientoCorrectivo).toHaveBeenCalledWith(1);
    expect(mantenimientoCorrectivoService.getMantenimientosCorrectivos).toHaveBeenCalledTimes(2); // 1 inicial + 1 recarga
  });

  it('Debería llamar a navigate al hacer clic en una fila', async () => {
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const mantenimientoIdParaNavegar = 123;
    act(() => {
        result.current.handleRowClick(mantenimientoIdParaNavegar);
    });

    // Verifico que se llamó a la función de navegación con los parámetros correctos
    expect(mockNavigate).toHaveBeenCalledWith('/correctivo', {
        state: { mantenimientoId: mantenimientoIdParaNavegar },
    });
  });

  it('Debería devolver el nombre correcto con las funciones auxiliares', async () => {
    const { result } = renderHook(() => useMantenimientoCorrectivo());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Pruebo las funciones `get...Nombre`
    expect(result.current.getSucursalNombre(101)).toBe('Sucursal A');
    expect(result.current.getCuadrillaNombre(1)).toBe('Cuadrilla Alfa');
    expect(result.current.getZonaNombre(101)).toBe('Norte');
    
    // Pruebo el caso en que no encuentra un ID
    expect(result.current.getSucursalNombre(999)).toBe('Desconocida');
  });
});