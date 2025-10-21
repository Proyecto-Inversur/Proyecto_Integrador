// tests/hooks/usePreventivo.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hook bajo prueba
import usePreventivo from '../../src/hooks/mantenimientos/usePreventivo';

// Módulos a mockear
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as mapsService from '../../src/services/maps';
import * as chatsService from '../../src/services/chats';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';
import * as useIsMobile from '../../src/hooks/useIsMobile';
import * as useChat from '../../src/hooks/mantenimientos/useChat';

// --- Mocks de módulos ---
vi.mock('../../src/services/mantenimientoPreventivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/maps');
vi.mock('../../src/services/chats');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('../../src/hooks/useIsMobile');
vi.mock('../../src/hooks/mantenimientos/useChat');

describe('Hook: usePreventivo', () => {
  // Datos base reutilizables
  const baseMantenimiento = {
    id: 'p1',
    id_sucursal: 101,
    estado: 'Pendiente',
    fotos: [],
    planillas: [],
    fecha_cierre: null, // 👈 IMPORTANTE para testear rama "finalizar"
  };
  const mockSucursales = [{ id: 101, nombre: 'Sucursal Test' }];
  const mockCuadrillas = [{ id: 201, nombre: 'Cuadrilla Test' }];

  beforeEach(() => {
    vi.clearAllMocks();

    // Hooks auxiliares
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({
      id: 1,
      uid: 'user-uid',
      nombre: 'Test User',
      isUser: true,
    });
    vi.spyOn(useIsMobile, 'default').mockReturnValue(false);
    vi.spyOn(useChat, 'default').mockReturnValue({
      chatBoxRef: { current: null },
      scrollToBottom: vi.fn(),
    });

    // Servicios (defaults)
    vi.mocked(mantenimientoPreventivoService.getMantenimientoPreventivo)
      .mockResolvedValue({ data: baseMantenimiento });
    vi.mocked(sucursalService.getSucursales)
      .mockResolvedValue({ data: mockSucursales });
    vi.mocked(cuadrillaService.getCuadrillas)
      .mockResolvedValue({ data: mockCuadrillas });
    vi.mocked(mapsService.getPreventivos)
      .mockResolvedValue({ data: [] });
    vi.mocked(chatsService.getChatPreventivo)
      .mockResolvedValue({ data: [] });
    vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo)
      .mockResolvedValue({});
  });

  it('Debería cargar todos los datos iniciales al montarse', async () => {
    const { result } = renderHook(() => usePreventivo('p1'));

    // Al inicio, el hook debe estar en estado de carga
    expect(result.current.isLoading).toBe(true);

    // Espero a que la carga termine
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Servicios llamados con los parámetros esperados
    expect(mantenimientoPreventivoService.getMantenimientoPreventivo)
      .toHaveBeenCalledWith('p1');
    expect(sucursalService.getSucursales).toHaveBeenCalled();
    expect(cuadrillaService.getCuadrillas).toHaveBeenCalled();
    expect(chatsService.getChatPreventivo).toHaveBeenCalledWith('p1');

    // Estado poblado
    expect(result.current.mantenimiento).toEqual(baseMantenimiento);
  });

  it('Debería llamar a selectPreventivo y actualizar estado al agregar a la ruta', async () => {
    const { result } = renderHook(() => usePreventivo('p1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // En este proyecto, el toggle suele venir del hook común spread (...common)
    // Si tu API expone handleAddToRoute directamente, cámbialo aquí.
    await act(async () => {
      // algunas implementaciones lo exponen como toggleRoute
      await (result.current as any).toggleRoute?.();
      // si no existe toggleRoute en tu versión, usa:
      // await result.current.handleAddToRoute();
    });

    expect(mapsService.selectPreventivo).toHaveBeenCalledWith({
      id_mantenimiento: baseMantenimiento.id,
      id_sucursal: baseMantenimiento.id_sucursal,
    });

    // Debe haber intentado avanzar de 'Pendiente' a 'En Progreso'
    expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).toHaveBeenCalled();
    const formDataSent = vi
      .mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo)
      .mock.calls[0][1] as FormData;
    expect(formDataSent.get('estado')).toBe('En Progreso');
  });

  it('NO debería permitir finalizar si faltan planillas o fotos', async () => {
    // Forzamos explícitamente fecha_cierre = null para entrar en la rama de "finalizar"
    vi.mocked(mantenimientoPreventivoService.getMantenimientoPreventivo)
      .mockResolvedValueOnce({
        data: { ...baseMantenimiento, fecha_cierre: null, fotos: [], planillas: [] },
      });

    const { result } = renderHook(() => usePreventivo('p1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleFinish();
    });

    await waitFor(() => {
      expect(result.current.error)
        .toBe('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
    });

    expect(mantenimientoPreventivoService.updateMantenimientoPreventivo)
      .not.toHaveBeenCalled();
  });

  it('Debería permitir finalizar si el mantenimiento tiene planillas y fotos', async () => {
    // Caso de finalización real: fecha_cierre null + tiene planillas y fotos
    const mantenimientoCompleto = {
      ...baseMantenimiento,
      fecha_cierre: null,
      planillas: ['url_planilla.pdf'],
      fotos: ['url_foto.jpg'],
    };
    vi.mocked(mantenimientoPreventivoService.getMantenimientoPreventivo)
      .mockResolvedValueOnce({ data: mantenimientoCompleto });

    const { result } = renderHook(() => usePreventivo('p1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleFinish();
    });

    expect(mantenimientoPreventivoService.updateMantenimientoPreventivo)
      .toHaveBeenCalledTimes(1);

    const formDataSent = vi
      .mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo)
      .mock.calls[0][1] as FormData;

    // Debe enviar una fecha YYYY-MM-DD (la actual)
    expect(formDataSent.get('fecha_cierre')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('Debería llamar a sendMessagePreventivo con los datos correctos', async () => {
    const { result } = renderHook(() => usePreventivo('p1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simular entrada de mensaje + archivo
    act(() => {
      result.current.setNuevoMensaje('Mensaje de prueba');
      result.current.setArchivoAdjunto(new File(['contenido'], 'archivo.txt'));
    });

    await act(async () => {
      await result.current.handleEnviarMensaje();
    });

    expect(chatsService.sendMessagePreventivo)
      .toHaveBeenCalledWith('p1', expect.any(FormData));

    const formDataSent = vi
      .mocked(chatsService.sendMessagePreventivo)
      .mock.calls[0][1] as FormData;

    expect(formDataSent.get('firebase_uid')).toBe('user-uid');
    expect(formDataSent.get('nombre_usuario')).toBe('Test User');
    expect(formDataSent.get('texto')).toBe('Mensaje de prueba');
    expect(formDataSent.get('archivo')).toBeInstanceOf(File);
  });
});
