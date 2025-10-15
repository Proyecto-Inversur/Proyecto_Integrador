import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook a probar y el servicio que vamos a simular.
import useCuadrillas from '../../src/hooks/forms/useCuadrillas';
import * as cuadrillaService from '../../src/services/cuadrillaService';

// Simulo el módulo completo del servicio para controlar sus funciones.
vi.mock('../../src/services/cuadrillaService');

describe('Hook: useCuadrillas', () => {

    // Defino datos de prueba que usaré en varios tests.
    const mockCuadrillasData = [
        { id: 1, nombre: 'Cuadrilla Alfa' },
        { id: 2, nombre: 'Cuadrilla Beta' },
    ];

    beforeEach(() => {
        // Antes de cada test, limpio los mocks.
        vi.clearAllMocks();
        // Configuro una respuesta exitosa por defecto para `getCuadrillas`.
        vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillasData });
        vi.mocked(cuadrillaService.deleteCuadrilla).mockResolvedValue({});
    });

    it('Debería empezar en estado de carga y luego obtener las cuadrillas', async () => {
        // `renderHook` ejecuta nuestro hook en un entorno de prueba.
        const { result } = renderHook(() => useCuadrillas());

        // Al principio, el estado de carga debe ser verdadero.
        expect(result.current.isLoading).toBe(true);

        // `waitFor` espera a que las actualizaciones de estado asíncronas terminen.
        await waitFor(() => {
            // Verifico que el estado de carga ahora sea falso.
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que el servicio fue llamado y los datos se guardaron en el estado.
        expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(1);
        expect(result.current.cuadrillas).toEqual(mockCuadrillasData);
        expect(result.current.error).toBeNull();
    });
    
    it('Debería manejar correctamente un error al cargar las cuadrillas', async () => {
        const errorMessage = 'Error de red';
        // Para este test, simulo que la llamada a la API falla.
        vi.mocked(cuadrillaService.getCuadrillas).mockRejectedValueOnce({
            response: { data: { detail: errorMessage } }
        });

        const { result } = renderHook(() => useCuadrillas());

        // Espero a que la carga termine (aunque falle).
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que el estado de error se haya actualizado.
        expect(result.current.error).toBe(errorMessage);
        // Y que no haya datos de cuadrillas.
        expect(result.current.cuadrillas).toEqual([]);
    });

    it('Debería actualizar el estado para editar una cuadrilla', () => {
        const { result } = renderHook(() => useCuadrillas());
        const cuadrillaParaEditar = mockCuadrillasData[0];

        // `act` envuelve las acciones que causan actualizaciones de estado síncronas.
        act(() => {
            result.current.handleEdit(cuadrillaParaEditar);
        });

        // Verifico que el estado se actualizó para mostrar el formulario con la cuadrilla seleccionada.
        expect(result.current.showForm).toBe(true);
        expect(result.current.selectedCuadrilla).toEqual(cuadrillaParaEditar);
    });

    it('Debería resetear el estado y recargar los datos al cerrar el formulario', async () => {
        const { result } = renderHook(() => useCuadrillas());

        // Primero, simulo que abrimos el formulario para tener un estado que resetear.
        act(() => {
            result.current.handleEdit(mockCuadrillasData[0]);
        });
        
        // Ahora, simulo el cierre del formulario.
        await act(async () => {
            result.current.handleFormClose();
        });

        // Verifico que el estado se haya reseteado.
        expect(result.current.showForm).toBe(false);
        expect(result.current.selectedCuadrilla).toBeNull();
        // Verifico que se haya vuelto a llamar a `getCuadrillas` (1 vez al inicio, 1 vez al cerrar).
        expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(2);
    });

    it('Debería llamar a deleteCuadrilla y recargar los datos al eliminar', async () => {
        const { result } = renderHook(() => useCuadrillas());
        const idParaEliminar = 1;

        // Espero a que la carga inicial termine.
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        // Simulo la acción de eliminar.
        await act(async () => {
            await result.current.handleDelete(idParaEliminar);
        });
        
        // Verifico que se llamó al servicio de eliminación con el ID correcto.
        expect(cuadrillaService.deleteCuadrilla).toHaveBeenCalledWith(idParaEliminar);
        // Verifico que se recargaron los datos.
        expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(2);
    });
});