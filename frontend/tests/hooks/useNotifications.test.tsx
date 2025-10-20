// frontend/tests/hooks/useNotifications.test.tsx

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';

// Importo el hook a probar y sus dependencias para simularlas
import useNotifications from '../../src/hooks/useNotifications';
import { AuthContext } from '../../src/context/AuthContext';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';
import * as notificacionesService from '../../src/services/notificaciones';
import * as notificationWsService from '../../src/services/notificationWs';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('../../src/services/notificaciones');
vi.mock('../../src/services/notificationWs');

describe('Hook: useNotifications', () => {

    // Defino los mocks para las funciones de los servicios
    const mockNavigate = vi.fn();
    const mockLogOut = vi.fn();
    const mockSocket = { close: vi.fn(), readyState: 1 };
    let webSocketCallback; // Para simular mensajes del WebSocket

    // Wrapper personalizado para proveer el AuthContext
    const wrapper = ({ children }) => (
        <AuthContext.Provider value={{ logOut: mockLogOut }}>
            {children}
        </AuthContext.Provider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Configuro las respuestas por defecto de los hooks y servicios
        vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ uid: 'user-123' });
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);

        // Mocks de los servicios
        vi.mocked(notificacionesService.get_notificaciones_correctivos).mockResolvedValue({ data: [] });
        vi.mocked(notificacionesService.get_notificaciones_preventivos).mockResolvedValue({ data: [] });
        vi.mocked(notificacionesService.correctivo_leido).mockResolvedValue({});
        vi.mocked(notificacionesService.preventivo_leido).mockResolvedValue({});
        vi.mocked(notificacionesService.delete_notificacion).mockResolvedValue({});
        
        // Simulo el WebSocket y capturo su callback `onMessage`
        vi.mocked(notificationWsService.subscribeToNotifications).mockImplementation((uid, onMessage) => {
            webSocketCallback = onMessage; // Guardo el callback para usarlo en los tests
            return mockSocket;
        });
    });

    it('Debería cargar las notificaciones, combinarlas, ordenarlas y contarlas al inicio', async () => {
        // Preparo datos de prueba
        const correctivos = [{ id: 1, leida: false, created_at: '2025-10-20T10:00:00Z' }];
        const preventivos = [{ id: 2, leida: true, created_at: '2025-10-21T10:00:00Z' }]; // Más reciente
        vi.mocked(notificacionesService.get_notificaciones_correctivos).mockResolvedValue({ data: correctivos });
        vi.mocked(notificacionesService.get_notificaciones_preventivos).mockResolvedValue({ data: preventivos });
        
        const { result } = renderHook(() => useNotifications(), { wrapper });

        // Espero a que la carga asíncrona termine
        await waitFor(() => {
            // Verifico que se haya llamado a los servicios
            expect(notificacionesService.get_notificaciones_correctivos).toHaveBeenCalledWith('user-123');
            expect(notificacionesService.get_notificaciones_preventivos).toHaveBeenCalledWith('user-123');
            
            // Verifico que el contador de no leídas sea 1
            expect(result.current.unreadCount).toBe(1);
            // Verifico que las notificaciones estén ordenadas por fecha (la más reciente primero)
            expect(result.current.notifications[0].id).toBe(2);
            expect(result.current.notifications[1].id).toBe(1);
        });
    });

    it('Debería suscribirse al WebSocket y recibir un nuevo mensaje', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        
        // Espero a que el hook se inicialice
        await waitFor(() => expect(notificacionesService.get_notificaciones_correctivos).toHaveBeenCalled());

        expect(notificationWsService.subscribeToNotifications).toHaveBeenCalledWith('user-123', expect.any(Function));
        
        // Simulo la llegada de un nuevo mensaje por el WebSocket
        const nuevoMensaje = { id: 3, leida: false, created_at: new Date().toISOString() };
        act(() => {
            webSocketCallback(nuevoMensaje);
        });

        // Verifico que el nuevo mensaje se añadió al principio y el contador se actualizó
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe(3);
        expect(result.current.unreadCount).toBe(1);
    });

    it('Debería llamar a navigate y marcar como leído al hacer clic en una notificación', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        const notifCorrectiva = { id: 1, tipo: 'correctivo', id_mantenimiento: 100 };

        await act(async () => {
            await result.current.handleClick(notifCorrectiva);
        });

        // Verifico que se navegue a la página correcta
        expect(mockNavigate).toHaveBeenCalledWith('/correctivo', { state: { mantenimientoId: 100 } });
        // Verifico que se haya llamado al servicio para marcarla como leída
        expect(notificacionesService.correctivo_leido).toHaveBeenCalledWith(1);
        // Verifico que se hayan recargado las notificaciones después
        expect(notificacionesService.get_notificaciones_correctivos).toHaveBeenCalledTimes(2);
    });

    it('Debería llamar a delete_notificacion y recargar al eliminar', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        await waitFor(() => expect(notificacionesService.get_notificaciones_correctivos).toHaveBeenCalled());

        const fakeEvent = { stopPropagation: vi.fn() };
        
        await act(async () => {
            await result.current.handleDeleteNotification(1, fakeEvent);
        });
        
        expect(fakeEvent.stopPropagation).toHaveBeenCalled();
        expect(notificacionesService.delete_notificacion).toHaveBeenCalledWith(1);
        expect(notificacionesService.get_notificaciones_correctivos).toHaveBeenCalledTimes(2);
    });

    it('Debería llamar a logOut y desconectar el socket al hacer logout', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        
        await act(async () => {
            await result.current.handleLogout();
        });

        expect(mockSocket.close).toHaveBeenCalled();
        expect(mockLogOut).toHaveBeenCalled();
    });
});