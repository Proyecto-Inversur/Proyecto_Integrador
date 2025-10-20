import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapaDesktop from '../../src/components/maps/MapaDesktop';

// Simulamos los componentes hijos para aislar el test y enfocarnos solo en MapaDesktop.
// Para MapSidebar, guardamos las props que nos interesan en atributos `data-*` para poder verificarlas.
vi.mock('../../src/components/maps/MapSidebar', () => ({
    default: (props) => (
        <div 
            data-testid="map-sidebar"
            data-cuadrillas={JSON.stringify(props.cuadrillas)}
            data-encargados={JSON.stringify(props.encargados)}
            data-sucursales={JSON.stringify(props.sucursales)}
        />
    )
}));

vi.mock('../../src/components/BackButton', () => ({
    default: () => <div data-testid="back-button" />
}));


describe('MapaDesktop', () => {

  // Creamos funciones "espía" para simular las que se pasan como props.
  // Esto nos permite verificar si son llamadas correctamente.
  const mockRotarNorte = vi.fn();
  const mockToggleCuadrillas = vi.fn();
  const mockToggleEncargados = vi.fn();
  const mockToggleSucursales = vi.fn();
  const mockSetIsSidebarOpen = vi.fn();

  // Definimos un set de datos por defecto para usar en los tests.
  const defaultProps = {
    mapRef: { current: null },
    compassRef: { current: null },
    rotarNorte: mockRotarNorte,
    toggleCuadrillas: mockToggleCuadrillas,
    toggleEncargados: mockToggleEncargados,
    toggleSucursales: mockToggleSucursales,
    showCuadrillas: false,
    showEncargados: false,
    showSucursales: false,
    cuadrillas: [{ id: 1, name: 'Cuadrilla A' }],
    users: [{ id: 1, name: 'Usuario A' }],
    sucursales: [{ id: 1, name: 'Sucursal A' }],
    onSelectCuadrilla: vi.fn(),
    onSelectEncargado: vi.fn(),
    onSelectSucursal: vi.fn(),
    setIsSidebarOpen: mockSetIsSidebarOpen,
  };

  // Antes de cada test, limpiamos el historial de llamadas de nuestras funciones espía.
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // Función auxiliar para renderizar el componente dentro del contexto de Router.
  const renderWithRouter = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <MapaDesktop {...props} />
      </MemoryRouter>
    );
  };

  it('Debería mostrar correctamente la pantalla inicial del mapa', () => {
    renderWithRouter();
    
    expect(screen.getByText('Mapa de Usuarios y Sucursales')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('map-sidebar')).toBeInTheDocument();
    expect(document.querySelector('.ruta-map')).toBeInTheDocument();
    expect(screen.getByLabelText('Orientar al norte')).toBeInTheDocument();
  });

  it('Debería activar las funciones de filtro al hacer clic en los botones', () => {
    renderWithRouter();
    
    const cuadrillasButton = document.querySelector('.cuadrillas');
    fireEvent.click(cuadrillasButton);
    expect(mockToggleCuadrillas).toHaveBeenCalledTimes(1);

    const encargadosButton = document.querySelector('.encargados');
    fireEvent.click(encargadosButton);
    expect(mockToggleEncargados).toHaveBeenCalledTimes(1);

    const sucursalesButton = document.querySelector('.sucursales');
    fireEvent.click(sucursalesButton);
    expect(mockToggleSucursales).toHaveBeenCalledTimes(1);
  });

  it('Debería activar la función de orientar al norte al hacer clic en la brújula', () => {
    renderWithRouter();
    
    const compass = screen.getByLabelText('Orientar al norte');
    fireEvent.click(compass);
    expect(mockRotarNorte).toHaveBeenCalledTimes(1);
  });

  it('Debería resaltar un botón cuando su filtro está activado', () => {
    const propsConActive = { ...defaultProps, showCuadrillas: true, showSucursales: false };
    renderWithRouter(propsConActive);
    
    const cuadrillasButton = document.querySelector('.cuadrillas');
    const sucursalesButton = document.querySelector('.sucursales');
    
    expect(cuadrillasButton).toHaveClass('active');
    expect(sucursalesButton).not.toHaveClass('active');
  });

  it('Debería enviar la información correcta a la barra lateral', () => {
    renderWithRouter();

    const sidebar = screen.getByTestId('map-sidebar');
    
    // Comparamos la versión en texto (JSON) de los datos para verificar que se pasaron correctamente.
    expect(sidebar).toHaveAttribute('data-cuadrillas', JSON.stringify(defaultProps.cuadrillas));
    expect(sidebar).toHaveAttribute('data-encargados', JSON.stringify(defaultProps.users));
    expect(sidebar).toHaveAttribute('data-sucursales', JSON.stringify(defaultProps.sucursales));
  });
});