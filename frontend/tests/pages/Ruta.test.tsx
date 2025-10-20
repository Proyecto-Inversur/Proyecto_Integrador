import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo los hooks y la página para poder simularlos.
import useLeafletMap from '../../src/hooks/maps/useLeafletMap';
import useRuta from '../../src/hooks/maps/useRuta';
import Ruta from '../../src/pages/Ruta';

// --- Mocks ---
// Simulo todas las dependencias para aislar completamente la página.

// 1. Simulo los hooks que proveen la lógica y los datos.
vi.mock('../../src/hooks/maps/useLeafletMap');
vi.mock('../../src/hooks/maps/useRuta');

// 2. Simulo el hook `useNavigate` de react-router-dom.
// Esto nos permite espiar si la función de navegación es llamada.
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useNavigate: vi.fn(),
  };
});

// 3. Simulo el componente hijo `RutaLayout`. Lo hago un poco "inteligente" para poder
//    verificar las props que recibe y simular una interacción.
vi.mock('../../src/components/maps/RutaLayout', () => ({
  default: (props) => (
    <div data-testid="ruta-layout" data-is-navigating={props.isNavigating}>
      {/* Agrego un botón para probar la función de navegación que se pasa como prop */}
      <button onClick={props.navigateHome}>Volver a Inicio</button>
    </div>
  ),
}));

describe('Página Ruta', () => {

  // Defino una función "espía" para simular `Maps`.
  const mockNavigate = vi.fn();

  // Defino la salida por defecto de mis hooks simulados.
  const mockUseLeafletMapReturn = {
    mapRef: { current: null },
    mapInstanceRef: { current: null },
    createRoutingControl: vi.fn(),
  };

  const mockUseRutaReturn = {
    compassRutaRef: { current: null },
    isNavigating: false,
    isCenter: false,
    centerOnUser: vi.fn(),
    toggleNavegacion: vi.fn(),
    borrarRuta: vi.fn(),
    rotarNorte: vi.fn(),
  };

  beforeEach(() => {
    // Antes de cada test, limpio los mocks y los reseteo a sus valores por defecto.
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLeafletMap).mockReturnValue(mockUseLeafletMapReturn);
    vi.mocked(useRuta).mockReturnValue(mockUseRutaReturn);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Ruta />
      </MemoryRouter>
    );
  };

  it('Debería renderizar el componente RutaLayout', () => {
    renderPage();
    // Verifico que el componente hijo principal se muestre.
    expect(screen.getByTestId('ruta-layout')).toBeInTheDocument();
  });

  it('Debería pasar las props correctas de los hooks a RutaLayout', () => {
    // Simulo un estado diferente para verificar que se pasa correctamente.
    vi.mocked(useRuta).mockReturnValue({
      ...mockUseRutaReturn,
      isNavigating: true,
    });
    
    renderPage();

    const layout = screen.getByTestId('ruta-layout');
    
    // Verifico que la prop `isNavigating` se pasó correctamente al componente hijo
    // a través del atributo `data-is-navigating` que definí en el mock.
    expect(layout).toHaveAttribute('data-is-navigating', 'true');
  });

  it('Debería llamar a navigate("/") cuando se ejecuta la función navigateHome', () => {
    renderPage();

    // Busco el botón "Volver a Inicio" que creé en mi mock de RutaLayout.
    const backButton = screen.getByRole('button', { name: /Volver a Inicio/i });
    
    // Simulo un clic en ese botón.
    fireEvent.click(backButton);

    // Verifico que la función `Maps` fue llamada con la ruta correcta.
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});