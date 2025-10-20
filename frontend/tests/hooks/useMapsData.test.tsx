import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo la función específica, ya que está exportada con nombre.
import { useMapsData } from '../../src/hooks/maps/useMapsData'; 
import * as mapsService from '../../src/services/maps';
import * as mantenimientoCorrectivoService from '../../src/services/mantenimientoCorrectivoService';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';

// --- Mocks ---
vi.mock('../../src/services/maps');
vi.mock('../../src/services/mantenimientoCorrectivoService');
vi.mock('../../src/services/mantenimientoPreventivoService');

describe('Hook: useMapsData', () => {

    // Defino datos de prueba para las respuestas de los servicios
    const mockUsers = [
        { id: 1, tipo: 'cuadrilla', name: 'Cuadrilla 1', lat: '-31.4', lng: '-64.1' },
        { id: 2, tipo: 'Encargado de Mantenimiento', name: 'Encargado 1', lat: '-31.5', lng: '-64.2' },
        { id: 3, tipo: 'cuadrilla', name: 'Cuadrilla 2', lat: '0', lng: '0' }, // Usuario con coordenadas inválidas
    ];
    const mockSucursales = [{ id: 101, name: 'Sucursal A', lat: -31.4, lng: -64.1 }];
    const mockCorrectivos = [{ id: 1, id_sucursal: 101, fecha_cierre: null }]; // Correctivo abierto
    const mockPreventivos = [{ id: 2, id_sucursal: 101, fecha_cierre: '2025-10-10' }]; // Preventivo cerrado

    beforeEach(() => {
        vi.clearAllMocks();
        // Configuro las respuestas por defecto de los servicios simulados
        vi.mocked(mapsService.getUsersLocations).mockResolvedValue({ data: mockUsers });
        vi.mocked(mapsService.getSucursalesLocations).mockResolvedValue({ data: mockSucursales });
        vi.mocked(mantenimientoCorrectivoService.getMantenimientosCorrectivos).mockResolvedValue({ data: mockCorrectivos });
        vi.mocked(mantenimientoPreventivoService.getMantenimientosPreventivos).mockResolvedValue({ data: mockPreventivos });
        // Mocks para las llamadas internas que se hacen en el segundo useEffect
        vi.mocked(mapsService.getCorrectivos).mockResolvedValue({ data: [] });
        vi.mocked(mapsService.getPreventivos).mockResolvedValue({ data: [] });
    });

    it('Debería llamar a todos los servicios para obtener los datos iniciales', async () => {
        renderHook(() => useMapsData());

        // Espero a que las llamadas a la API se completen
        await waitFor(() => {
            expect(mapsService.getUsersLocations).toHaveBeenCalledTimes(1);
            expect(mapsService.getSucursalesLocations).toHaveBeenCalledTimes(1);
            expect(mantenimientoCorrectivoService.getMantenimientosCorrectivos).toHaveBeenCalledTimes(1);
            expect(mantenimientoPreventivoService.getMantenimientosPreventivos).toHaveBeenCalledTimes(1);
        });
    });

    it('Debería procesar y separar correctamente los datos', async () => {
        const { result } = renderHook(() => useMapsData());

        // Espero a que uno de los arrays de datos se llene,
        // lo que indica que el procesamiento ha terminado.
        await waitFor(() => {
            expect(result.current.cuadrillas.length).toBeGreaterThan(0);
        });

        // Ahora que sabemos que la carga terminó, podemos verificar los resultados.
        expect(result.current.cuadrillas).toHaveLength(1);
        expect(result.current.cuadrillas[0].name).toBe('Cuadrilla 1');
        
        expect(result.current.users).toHaveLength(1);
        expect(result.current.users[0].name).toBe('Encargado 1');
    });
});