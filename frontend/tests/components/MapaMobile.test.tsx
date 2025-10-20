import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapaMobile from '../../src/components/maps/MapaMobile';

// Simulamos el componente hijo `MapInfoPanel` para probar `MapaMobile` de forma aislada.
// El mock incluye un botón "Cerrar Panel" que llama a la prop `onClose`, 
// lo que nos permite verificar si la comunicación entre componentes funciona.
vi.mock('../../src/components/maps/MapInfoPanel', () => ({
    default: (props) => (
        <div data-testid="map-info-panel">
            <button onClick={props.onClose}>Cerrar Panel</button>
        </div>
    )
}));

describe('MapaMobile', () => {

  // Creamos funciones "espía" (mocks) para simular las props que el componente recibe.
  // Esto nos permite verificar si son llamadas correctamente durante el test.
  const mockRotarNorte = vi.fn();
  const mockToggleCuadrillas = vi.fn();
  const mockToggleEncargados = vi.fn();
  const mockToggleSucursales = vi.fn();
  const mockToggleSidebar = vi.fn();
  const mockNavigate = vi.fn();

  // Definimos un objeto con props por defecto para reutilizar en los tests 
  // y mantenerlos limpios y consistentes.
  const defaultProps = {
    mapRef: { current: null },
    compassRef: { current: null },
    rotarNorte: mockRotarNorte,
    toggleCuadrillas: mockToggleCuadrillas,
    toggleEncargados: mockToggleEncargados,
    toggleSucursales: mockToggleSucursales,
    isSidebarOpen: false,
    toggleSidebar: mockToggleSidebar,
    showCuadrillas: false,
    showEncargados: false,
    showSucursales: false,
    cuadrillas: [],
    users: [],
    sucursales: [],
    onSelectCuadrilla: vi.fn(),
    onSelectEncargado: vi.fn(),
    onSelectSucursal: vi.fn(),
    navigate: mockNavigate,
  };

  // Antes de que se ejecute cada test, `beforeEach` limpia el historial de todas las funciones mock.
  // Esto evita que una prueba interfiera con los resultados de otra.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Creamos una función auxiliar que envuelve nuestro componente en `MemoryRouter`.
  // Esto es necesario porque el componente utiliza funciones de navegación de `react-router-dom`.
  const renderWithRouter = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <MapaMobile {...props} />
      </MemoryRouter>
    );
  };

  // Este test verifica que la interfaz de usuario inicial se renderice correctamente.
  it('Debería mostrar la pantalla inicial del mapa móvil', () => {
    renderWithRouter();

    // Comprobamos que todos los elementos visuales esperados están presentes.
    expect(document.querySelector('.ruta-map')).toBeInTheDocument();
    expect(screen.getByTestId('map-info-panel')).toBeInTheDocument();
    expect(screen.getByLabelText(/orientar al norte/i)).toBeInTheDocument();
    expect(document.querySelector('.boton-volver')).toBeInTheDocument();
    expect(document.querySelector('.sidebar-toggle')).toBeInTheDocument();
  });

  // Este test simula la interacción del usuario con la interfaz.
  it('Debería llamar a las funciones correctas al hacer clic en los botones', () => {
    renderWithRouter();

    // Simulamos un clic en el botón de volver y verificamos que llama a `Maps`.
    fireEvent.click(document.querySelector('.boton-volver'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Hacemos clic en el botón del menú y verificamos que llama a `toggleSidebar`.
    fireEvent.click(document.querySelector('.sidebar-toggle'));
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);

    // Hacemos clic en el filtro de cuadrillas y verificamos su función.
    fireEvent.click(document.querySelector('.cuadrillas'));
    expect(mockToggleCuadrillas).toHaveBeenCalledTimes(1);
    
    // Hacemos clic en la brújula y verificamos su función.
    fireEvent.click(screen.getByLabelText(/orientar al norte/i));
    expect(mockRotarNorte).toHaveBeenCalledTimes(1);
  });

  // Este test comprueba la lógica de renderizado condicional.
  it('Debería mostrar la barra lateral como abierta si se le indica', () => {
    // Renderizamos el componente pasándole la instrucción de mostrar la barra lateral.
    renderWithRouter({ ...defaultProps, isSidebarOpen: true });
    
    // Verificamos que se añada la clase CSS 'open' a la barra lateral.
    const sidebar = document.querySelector('.map-mobile-sidebar');
    expect(sidebar).toHaveClass('open');
  });

  // De manera similar al test anterior, este comprueba el resaltado de los botones.
  it('Debería resaltar un botón de filtro cuando está activado', () => {
    // Renderizamos indicando que el filtro de encargados está activo.
    renderWithRouter({ ...defaultProps, showEncargados: true });
    
    const encargadosButton = document.querySelector('.encargados');
    expect(encargadosButton).toHaveClass('active');

    // También verificamos que otro botón no tenga la clase para estar seguros.
    const cuadrillasButton = document.querySelector('.cuadrillas');
    expect(cuadrillasButton).not.toHaveClass('active');
  });

  // Este test verifica la comunicación entre el componente padre y el hijo (simulado).
  it('Debería llamar a la función para cerrar la barra lateral desde el panel de info', () => {
    renderWithRouter();
    
    // Buscamos y hacemos clic en el botón "Cerrar Panel" que definimos en nuestro mock.
    const closeButtonInPanel = screen.getByRole('button', { name: /Cerrar Panel/i });
    fireEvent.click(closeButtonInPanel);

    // Verificamos que se llamó a la función que pasamos como `onClose`, es decir, `toggleSidebar`.
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
});
});