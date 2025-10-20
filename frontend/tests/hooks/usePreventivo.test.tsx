import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook a probar y todas sus dependencias para poder simularlas
import usePreventivo from '../../src/hooks/mantenimientos/usePreventivo';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as mapsService from '../../src/services/maps';
import * as chatsService from '../../src/services/chats';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';
import * as useIsMobile from '../../src/hooks/useIsMobile';
import * as useChat from '../../src/hooks/mantenimientos/useChat';

// --- Mocks ---
// Simulo todos los módulos de los que depende el hook.
vi.mock('../../src/services/mantenimientoPreventivoService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/maps');
vi.mock('../../src/services/chats');
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('../../src/hooks/useIsMobile');
vi.mock('../../src/hooks/mantenimientos/useChat');

describe('Hook: usePreventivo', () => {

    // Defino datos de prueba reutilizables.
    const mockMantenimiento = { id: 'p1', id_sucursal: 101, estado: 'Pendiente', fotos: [], planillas: [] };
    const mockSucursales = [{ id: 101, nombre: 'Sucursal Test' }];
    const mockCuadrillas = [{ id: 201, nombre: 'Cuadrilla Test' }];

    beforeEach(() => {
        // Reseteo todos los mocks antes de cada test.
        vi.clearAllMocks();
        
        // Configuro las respuestas por defecto de los servicios y hooks simulados.
        vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1, uid: 'user-uid', nombre: 'Test User', isUser: true });
        vi.spyOn(useIsMobile, 'default').mockReturnValue(false);
        vi.spyOn(useChat, 'default').mockReturnValue({ chatBoxRef: { current: null }, scrollToBottom: vi.fn() });

        vi.mocked(mantenimientoPreventivoService.getMantenimientoPreventivo).mockResolvedValue({ data: mockMantenimiento });
        vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursales });
        vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillas });
        vi.mocked(mapsService.getPreventivos).mockResolvedValue({ data: [] });
        vi.mocked(chatsService.getChatPreventivo).mockResolvedValue({ data: [] });
        vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo).mockResolvedValue({});
    });

    it('Debería cargar todos los datos iniciales al montarse', async () => {
        const { result } = renderHook(() => usePreventivo('p1'));

        // Al inicio, el hook debe estar en estado de carga.
        expect(result.current.isLoading).toBe(true);

        // Espero a que la carga termine.
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que los servicios principales fueron llamados.
        expect(mantenimientoPreventivoService.getMantenimientoPreventivo).toHaveBeenCalledWith('p1');
        expect(sucursalService.getSucursales).toHaveBeenCalled();
        expect(cuadrillaService.getCuadrillas).toHaveBeenCalled();
        expect(chatsService.getChatPreventivo).toHaveBeenCalledWith('p1');

        // Verifico que los datos se hayan guardado en el estado.
        expect(result.current.mantenimiento).toEqual(mockMantenimiento);
    });

    it('Debería llamar a selectPreventivo y actualizar el estado al agregar a la ruta', async () => {
        const { result } = renderHook(() => usePreventivo('p1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Simulo la acción de agregar a la ruta. La función expuesta es `toggleRoute`.
        await act(async () => {
            await result.current.toggleRoute();
        });

        // Verifico que se llamó al servicio de mapas para seleccionar el preventivo.
        expect(mapsService.selectPreventivo).toHaveBeenCalledWith({
            id_mantenimiento: mockMantenimiento.id,
            id_sucursal: mockMantenimiento.id_sucursal
        });
        
        // Verifico que también intentó actualizar el estado a "En Progreso".
        expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).toHaveBeenCalled();
        const formDataSent = vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo).mock.calls[0][1];
        expect(formDataSent.get('estado')).toBe('En Progreso');
    });

    it('NO debería permitir finalizar si faltan planillas o fotos', async () => {
        const { result } = renderHook(() => usePreventivo('p1'));
        
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        // Intento finalizar sin tener planillas ni fotos.
        await act(async () => {
            await result.current.handleFinish();
        });

        // Verifico que el estado de error se haya actualizado con el mensaje correcto.
        expect(result.current.error).toBe('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
        // Y que no se haya intentado actualizar el mantenimiento.
        expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).not.toHaveBeenCalled();
    });
    
    it('Debería permitir finalizar si el mantenimiento tiene planillas y fotos', async () => {
        // Sobrescribo el mock para que el mantenimiento tenga los datos necesarios.
        const mantenimientoCompleto = { ...mockMantenimiento, planillas: ['url_planilla.pdf'], fotos: ['url_foto.jpg'] };
        vi.mocked(mantenimientoPreventivoService.getMantenimientoPreventivo).mockResolvedValue({ data: mantenimientoCompleto });

        const { result } = renderHook(() => usePreventivo('p1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        await act(async () => {
            await result.current.handleFinish();
        });

        // Verifico que se haya llamado a `updateMantenimientoPreventivo`.
        expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).toHaveBeenCalledTimes(1);

        // Verifico que el FormData enviado contenga una fecha de cierre.
        const formDataSent = vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo).mock.calls[0][1];
        expect(formDataSent.get('fecha_cierre')).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Chequea que sea una fecha en formato YYYY-MM-DD.
    });

    it('Debería llamar a sendMessagePreventivo con los datos correctos', async () => {
        const { result } = renderHook(() => usePreventivo('p1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Simulo que el usuario escribe un mensaje y adjunta un archivo.
        act(() => {
            result.current.setNuevoMensaje('Mensaje de prueba');
            result.current.setArchivoAdjunto(new File(['contenido'], 'archivo.txt'));
        });

        // Simulo el envío del mensaje.
        await act(async () => {
            await result.current.handleEnviarMensaje();
        });

        // Verifico que el servicio para enviar mensajes fue llamado.
        expect(chatsService.sendMessagePreventivo).toHaveBeenCalledWith('p1', expect.any(FormData));
        
        // Verifico el contenido del FormData.
        const formDataSent = vi.mocked(chatsService.sendMessagePreventivo).mock.calls[0][1];
        expect(formDataSent.get('firebase_uid')).toBe('user-uid');
        expect(formDataSent.get('nombre_usuario')).toBe('Test User');
        expect(formDataSent.get('texto')).toBe('Mensaje de prueba');
        expect(formDataSent.get('archivo')).toBeInstanceOf(File);
    });
});