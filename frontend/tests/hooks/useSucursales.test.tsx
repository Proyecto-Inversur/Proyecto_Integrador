import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook a probar y el servicio que vamos a simular.
import useSucursales from '../../src/hooks/forms/useSucursales';
import * as sucursalService from '../../src/services/sucursalService';

// Simulo el módulo completo del servicio para controlar sus funciones.
vi.mock('../../src/services/sucursalService');

describe('Hook: useSucursales', () => {

    // Defino datos de prueba que usaré en varios tests.
    const mockSucursalesData = [
        { id: 1, nombre: 'Sucursal Centro' },
        { id: 2, nombre: 'Sucursal Norte' },
    ];

    beforeEach(() => {
        // Antes de cada test, limpio los mocks y configuro respuestas por defecto.
        vi.clearAllMocks();
        vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: mockSucursalesData });
        vi.mocked(sucursalService.deleteSucursal).mockResolvedValue({});
    });

    it('Debería empezar en estado de carga y luego obtener las sucursales', async () => {
        // `renderHook` ejecuta nuestro hook en un entorno de prueba.
        const { result } = renderHook(() => useSucursales());

        // Al principio, el estado de carga debe ser verdadero.
        expect(result.current.isLoading).toBe(true);

        // `waitFor` espera a que las actualizaciones de estado asíncronas terminen.
        await waitFor(() => {
            // Verifico que el estado de carga ahora sea falso.
            expect(result.current.isLoading).toBe(false);
        });

        // Verifico que el servicio fue llamado y los datos se guardaron en el estado.
        expect(sucursalService.getSucursales).toHaveBeenCalledTimes(1);
        expect(result.current.sucursales).toEqual(mockSucursalesData);
    });

    it('Debería actualizar el estado para editar una sucursal', async () => {
        const { result } = renderHook(() => useSucursales());
        // Espero a que la carga inicial termine antes de actuar.
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const sucursalParaEditar = mockSucursalesData[0];

        // `act` envuelve las acciones que causan actualizaciones de estado síncronas.
        act(() => {
            result.current.handleEdit(sucursalParaEditar);
        });

        // Verifico que el estado se actualizó para mostrar el formulario con la sucursal seleccionada.
        expect(result.current.showForm).toBe(true);
        expect(result.current.selectedSucursal).toEqual(sucursalParaEditar);
    });

    it('Debería resetear el estado y recargar los datos al cerrar el formulario', async () => {
        const { result } = renderHook(() => useSucursales());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Primero, simulo que abrimos el formulario para tener un estado que resetear.
        act(() => {
            result.current.handleEdit(mockSucursalesData[0]);
        });
        
        // Ahora, simulo el cierre del formulario. `handleFormClose` es asíncrona, así que la envolvemos en `act`.
        await act(async () => {
            await result.current.handleFormClose();
        });

        // Verifico que el estado se haya reseteado.
        expect(result.current.showForm).toBe(false);
        expect(result.current.selectedSucursal).toBeNull();
        
        // Verifico que se haya vuelto a llamar a `getSucursales` (1 vez al inicio, 1 vez al cerrar).
        expect(sucursalService.getSucursales).toHaveBeenCalledTimes(2);
    });

    it('Debería llamar a deleteSucursal y recargar los datos al eliminar', async () => {
        const { result } = renderHook(() => useSucursales());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const idParaEliminar = 1;
        
        // Simulo la acción de eliminar.
        await act(async () => {
            await result.current.handleDelete(idParaEliminar);
        });
        
        // Verifico que se llamó al servicio de eliminación con el ID correcto.
        expect(sucursalService.deleteSucursal).toHaveBeenCalledWith(idParaEliminar);
        
        // Verifico que se recargaron los datos.
        expect(sucursalService.getSucursales).toHaveBeenCalledTimes(2);
    });
});