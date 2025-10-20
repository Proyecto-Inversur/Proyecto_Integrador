import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRutaData } from '../../src/hooks/maps/useRutaData';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';
import { LocationContext } from '../../src/context/LocationContext';
import * as mapsService from '../../src/services/maps';
import * as notificacionesService from '../../src/services/notificaciones';
import * as mantenimientoService from '../../src/services/mantenimientoCorrectivoService';
import * as preventivoService from '../../src/services/mantenimientoPreventivoService';

// --- Mocks ---
vi.mock('../../src/hooks/useAuthRoles');
vi.mock('../../src/services/maps');
vi.mock('../../src/services/notificaciones');
vi.mock('../../src/services/mantenimientoCorrectivoService');
vi.mock('../../src/services/mantenimientoPreventivoService');

// Mockeamos Leaflet porque `checkNearbyMaintenances` usa `L.latLng`
const mockLatLng = { distanceTo: vi.fn(() => 5000) };
vi.stubGlobal('L', { latLng: vi.fn(() => mockLatLng) });

describe('Hook: useRutaData', () => {
    
    // Wrapper para proveer el LocationContext que el hook necesita
    const wrapper = ({ children }) => (
      <LocationContext.Provider value={{ userLocation: { lat: -31, lng: -64 } }}>
        {children}
      </LocationContext.Provider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue({ id: 1 });
        vi.mocked(mapsService.getSucursalesLocations).mockResolvedValue({ data: [{ id: 101, lat: -31.1, lng: -64.1 }] });
        vi.mocked(mapsService.getCorrectivos).mockResolvedValue({ data: [{ id_sucursal: 101 }] });
        vi.mocked(mapsService.getPreventivos).mockResolvedValue({ data: [] });
    });

    it('Debería llamar a los servicios para obtener los datos de la ruta', async () => {
        const { result } = renderHook(() => useRutaData(true), { wrapper });
        
        await act(async () => {
            await result.current.fetchData();
        });

        expect(mapsService.getSucursalesLocations).toHaveBeenCalled();
        expect(mapsService.getCorrectivos).toHaveBeenCalledWith(1);
        expect(mapsService.getPreventivos).toHaveBeenCalledWith(1);
    });
    
    it('Debería filtrar y ordenar las sucursales correctamente', async () => {
        const { result } = renderHook(() => useRutaData(true), { wrapper });
        
        await act(async () => {
            await result.current.fetchData();
        });

        // Verificamos que el estado `sucursales` contenga solo la sucursal seleccionada
        expect(result.current.sucursales).toHaveLength(1);
        expect(result.current.sucursales[0].id).toBe(101);
    });

    it('Debería llamar al servicio de notificaciones si encuentra mantenimientos cercanos', async () => {
        // Mockeamos datos adicionales para este test específico
        vi.mocked(mantenimientoService.getMantenimientosCorrectivos).mockResolvedValue({ 
            data: [{ id: 99, id_sucursal: 101, id_cuadrilla: 1, estado: 'Pendiente' }] 
        });
        vi.mocked(preventivoService.getMantenimientosPreventivos).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useRutaData(true), { wrapper });

        await act(async () => {
            // Pasamos una ubicación simulada
            await result.current.checkNearbyMaintenances({ distanceTo: () => 5000 });
        });

        // Verificamos que se haya intentado notificar
        expect(notificacionesService.notify_nearby_maintenances).toHaveBeenCalled();
    });
});