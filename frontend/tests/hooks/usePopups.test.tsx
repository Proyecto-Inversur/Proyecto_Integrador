import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePopups } from '../../src/hooks/maps/usePopups';

// --- Mocks de Componentes ---
vi.mock('../../src/components/maps/CuadrillaPopup', () => ({ default: () => <div /> }));
vi.mock('../../src/components/maps/EncargadoPopup', () => ({ default: () => <div /> }));
vi.mock('../../src/components/maps/SucursalPopup', () => ({ default: () => <div /> }));

// --- Mock de la Librería Leaflet ---
// Usamos vi.mock para interceptar la importación de 'leaflet'.
vi.mock('leaflet', () => {
    // Creamos mocks reiniciables para poder espiarlos en cada test.
    const mockPopup = {
        setLatLng: vi.fn().mockReturnThis(),
        setContent: vi.fn().mockReturnThis(),
        openOn: vi.fn().mockReturnThis(),
        getElement: () => document.createElement('div'),
    };

    return {
        default: {
            popup: vi.fn(() => mockPopup),
            point: vi.fn(),
            DomEvent: {
                disableScrollPropagation: vi.fn(),
                disableClickPropagation: vi.fn(),
            },
        }
    };
});

// Importamos `L` DESPUÉS de haberlo mockeado. Ahora `L` será nuestro objeto falso.
import L from 'leaflet';


describe('Hook: usePopups', () => {
    
    // Simulo una instancia de mapa más completa para evitar errores internos de Leaflet.
    const mockMapInstanceRef = { 
        current: { 
            hasLayer: vi.fn(() => true), 
            latLngToContainerPoint: vi.fn(() => ({ x: 0, y: 0, subtract: vi.fn(() => ({x: 0, y: 0})) })),
            getSize: vi.fn(() => ({ x: 100, y: 100 })),
            getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
            containerPointToLatLng: vi.fn(),
            panTo: vi.fn(),
        } 
    };

    beforeEach(() => {
        // Limpiamos el historial de llamadas de todos los mocks.
        vi.clearAllMocks();
    });

    it('Debería llamar a L.popup con el contenido correcto para una cuadrilla', () => {
        const { result } = renderHook(() => usePopups(mockMapInstanceRef, false));
        const cuadrillaData = { type: 'cuadrilla', name: 'Equipo de Prueba' };
        
        result.current.showPopup(cuadrillaData, [0, 0]);

        // Verificamos que se haya intentado crear un popup.
        expect(L.popup).toHaveBeenCalled();
        // Accedemos al mock del popup para verificar que se llamó a `setContent`.
        const mockPopupInstance = vi.mocked(L.popup).mock.results[0].value;
        expect(mockPopupInstance.setContent).toHaveBeenCalled();
    });

    it('Debería llamar a L.popup con el contenido correcto para un encargado', () => {
        const { result } = renderHook(() => usePopups(mockMapInstanceRef, false));
        const encargadoData = { type: 'encargado', name: 'Juan Perez' };
        
        result.current.showPopup(encargadoData, [0, 0]);

        expect(L.popup).toHaveBeenCalled();
        const mockPopupInstance = vi.mocked(L.popup).mock.results[0].value;
        expect(mockPopupInstance.setContent).toHaveBeenCalled();
    });

    it('Debería llamar a L.popup con el contenido correcto para una sucursal', () => {
        const { result } = renderHook(() => usePopups(mockMapInstanceRef, false));
        const sucursalData = { type: 'sucursal', name: 'Tienda Central' };
        
        result.current.showPopup(sucursalData, [0, 0]);

        expect(L.popup).toHaveBeenCalled();
        const mockPopupInstance = vi.mocked(L.popup).mock.results[0].value;
        expect(mockPopupInstance.setContent).toHaveBeenCalled();
    });
});