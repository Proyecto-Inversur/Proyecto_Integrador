import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import useChat from '../../src/hooks/mantenimientos/useChat';
import * as chatWs from '../../src/services/chatWs';

// Simulo el servicio de WebSocket.
vi.mock('../../src/services/chatWs');

describe('Hook: useChat', () => {
    
    // Uso `vi.useFakeTimers()` para controlar `setTimeout` dentro del test.
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Debería suscribirse al chat y recibir mensajes', () => {
        const setMensajes = vi.fn();
        let onMessageCallback; // Variable para capturar el callback que maneja los mensajes.

        // Simulo `subscribeToChat` para capturar el callback que se le pasa.
        vi.mocked(chatWs.subscribeToChat).mockImplementation((chatId, callback) => {
            onMessageCallback = callback;
            // Devuelvo un objeto socket simulado.
            return { close: vi.fn() };
        });

        renderHook(() => useChat('chat-123', setMensajes));

        // Verifico que se llamó a la suscripción con el ID correcto.
        expect(chatWs.subscribeToChat).toHaveBeenCalledWith('chat-123', expect.any(Function));

        // Simulo que el socket envía un array inicial de mensajes.
        const mensajesIniciales = [{ texto: 'Hola' }, { texto: 'Mundo' }];
        act(() => {
            onMessageCallback(mensajesIniciales);
        });
        
        // Verifico que `setMensajes` fue llamado con los datos iniciales.
        expect(setMensajes).toHaveBeenCalledWith(expect.any(Function));
        // `toHaveBeenCalledWith` no funciona bien con funciones, así que lo invoco manualmente para probarlo.
        const updaterFn = setMensajes.mock.calls[0][0];
        expect(updaterFn([])).toEqual(mensajesIniciales);

        // Simulo que llega un nuevo mensaje (no un array).
        const nuevoMensaje = { texto: 'Nuevo mensaje' };
        act(() => {
            onMessageCallback(nuevoMensaje);
        });

        // Verifico de nuevo, probando que el nuevo mensaje se añade al estado anterior.
        const updaterFn2 = setMensajes.mock.calls[1][0];
        expect(updaterFn2(mensajesIniciales)).toEqual([...mensajesIniciales, nuevoMensaje]);
    });

    it('Debería cerrar la conexión del socket al desmontar el componente', () => {
        const mockSocket = { close: vi.fn(), onclose: null, onerror: null };
        vi.mocked(chatWs.subscribeToChat).mockReturnValue(mockSocket);

        // `unmount` es una función devuelta por `renderHook` que simula que el componente desaparece.
        const { unmount } = renderHook(() => useChat('chat-123', vi.fn()));

        // Desmonto el componente.
        unmount();

        // Verifico que se haya llamado a la función de limpieza para cerrar la conexión.
        expect(mockSocket.close).toHaveBeenCalledTimes(1);
    });
});