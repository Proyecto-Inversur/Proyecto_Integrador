import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook a probar y el servicio que vamos a simular.
import useUsers from '../../src/hooks/forms/useUsers';
import * as userService from '../../src/services/userService';

// Simulo el módulo completo del servicio para controlar sus funciones.
vi.mock('../../src/services/userService');

describe('Hook: useUsers', () => {

    // Defino datos de prueba.
    const mockUsersData = [
        { id: 1, nombre: 'Usuario Alfa' },
        { id: 2, nombre: 'Usuario Beta' },
    ];

    beforeEach(() => {
        // Limpio los mocks y configuro respuestas por defecto antes de cada test.
        vi.clearAllMocks();
        vi.mocked(userService.getUsers).mockResolvedValue({ data: mockUsersData });
        vi.mocked(userService.deleteUser).mockResolvedValue({});
    });

    it('Debería empezar en estado de carga y luego obtener los usuarios', async () => {
        const { result } = renderHook(() => useUsers());

        // Al principio, el estado de carga debe ser verdadero.
        expect(result.current.isLoading).toBe(true);

        // Espero a que la carga asíncrona termine.
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que el servicio fue llamado y los datos se guardaron en el estado.
        expect(userService.getUsers).toHaveBeenCalledTimes(1);
        expect(result.current.users).toEqual(mockUsersData);
        expect(result.current.error).toBeNull();
    });
    
    it('Debería manejar un error al cargar los usuarios', async () => {
        const errorMessage = 'Error de red';
        // Simulo que la llamada a la API falla.
        vi.mocked(userService.getUsers).mockRejectedValueOnce({
            response: { data: { detail: errorMessage } }
        });

        const { result } = renderHook(() => useUsers());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que el estado de error se haya actualizado.
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.users).toEqual([]);
    });

    it('Debería actualizar el estado para editar un usuario', async () => {
        const { result } = renderHook(() => useUsers());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const userToEdit = mockUsersData[0];

        // `act` envuelve las acciones que causan actualizaciones de estado.
        act(() => {
            result.current.handleEdit(userToEdit);
        });

        // Verifico que el estado se actualizó para mostrar el formulario con el usuario seleccionado.
        expect(result.current.showForm).toBe(true);
        expect(result.current.selectedUser).toEqual(userToEdit);
    });

    it('Debería resetear el estado y recargar los datos al cerrar el formulario', async () => {
        const { result } = renderHook(() => useUsers());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handleEdit(mockUsersData[0]);
        });
        
        await act(async () => {
            await result.current.handleFormClose();
        });

        expect(result.current.showForm).toBe(false);
        expect(result.current.selectedUser).toBeNull();
        // Verifico que `getUsers` se haya llamado de nuevo (1 inicial + 1 al cerrar).
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
    });

    it('Debería llamar a deleteUser y recargar los datos al eliminar', async () => {
        const { result } = renderHook(() => useUsers());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const idToDelete = 1;
        
        await act(async () => {
            await result.current.handleDelete(idToDelete);
        });
        
        expect(userService.deleteUser).toHaveBeenCalledWith(idToDelete);
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
    });
});