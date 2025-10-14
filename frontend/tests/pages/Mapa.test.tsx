import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo los hooks y la página para poder simularlos.
import useIsMobile from '../../src/hooks/useIsMobile';
import useLeafletMap from '../../src/hooks/maps/useLeafletMap';
import useMapa from '../../src/hooks/maps/useMapa';
import Mapa from '../../src/pages/Mapa';

// --- Mocks ---
// Simulo todas las dependencias externas para aislar el componente.

// 1. Simulo los hooks. Controlar `useIsMobile` es la clave de este test.
vi.mock('../../src/hooks/useIsMobile');
vi.mock('../../src/hooks/maps/useLeafletMap');
vi.mock('../../src/hooks/maps/useMapa');

// 2. Simulo los componentes hijos para verificar cuál de los dos se renderiza.
vi.mock('../../src/components/maps/MapaDesktop', () => ({ 
    default: (props) => <div data-testid="mapa-desktop" data-users={JSON.stringify(props.users)} /> 
}));
vi.mock('../../src/components/maps/MapaMobile', () => ({ 
    default: (props) => <div data-testid="mapa-mobile" data-cuadrillas={JSON.stringify(props.cuadrillas)} /> 
}));

describe('Página Mapa', () => {

    // Defino la salida por defecto de mis hooks simulados.
    const mockUseLeafletMapReturn = {
        mapRef: { current: null },
        mapInstanceRef: { current: null },
        createRoutingControl: vi.fn(),
        rotarNorte: vi.fn(),
    };

    const mockUseMapaReturn = {
        users: [{ id: 1, name: 'Usuario Test' }],
        cuadrillas: [{ id: 2, name: 'Cuadrilla Test' }],
        sucursales: [],
        compassRef: { current: null },
        // ... (resto de las propiedades y funciones)
    };

    beforeEach(() => {
        // Antes de cada test, limpio los mocks y los reseteo a su estado por defecto.
        vi.clearAllMocks();
        vi.mocked(useLeafletMap).mockReturnValue(mockUseLeafletMapReturn);
        vi.mocked(useMapa).mockReturnValue(mockUseMapaReturn);
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Mapa />
            </MemoryRouter>
        );
    };

    it('Debería renderizar MapaDesktop cuando no es móvil', () => {
        // Simulo que el hook `useIsMobile` devuelve `false`.
        vi.mocked(useIsMobile).mockReturnValue(false);

        renderPage();

        // Verifico que el componente de escritorio esté en el DOM.
        const desktopComponent = screen.getByTestId('mapa-desktop');
        expect(desktopComponent).toBeInTheDocument();

        // Verifico que el componente móvil NO esté en el DOM.
        expect(screen.queryByTestId('mapa-mobile')).toBeNull();

        // Verifico que las props se pasen correctamente al componente de escritorio.
        expect(desktopComponent).toHaveAttribute('data-users', JSON.stringify(mockUseMapaReturn.users));
    });

    it('Debería renderizar MapaMobile cuando sí es móvil', () => {
        // Simulo que el hook `useIsMobile` devuelve `true`.
        vi.mocked(useIsMobile).mockReturnValue(true);

        renderPage();

        // Verifico que el componente móvil esté en el DOM.
        const mobileComponent = screen.getByTestId('mapa-mobile');
        expect(mobileComponent).toBeInTheDocument();

        // Verifico que el componente de escritorio NO esté en el DOM.
        expect(screen.queryByTestId('mapa-desktop')).toBeNull();
        
        // Verifico que las props se pasen correctamente al componente móvil.
        expect(mobileComponent).toHaveAttribute('data-cuadrillas', JSON.stringify(mockUseMapaReturn.cuadrillas));
    });
});