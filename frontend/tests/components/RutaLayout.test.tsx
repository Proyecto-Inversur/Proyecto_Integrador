import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RutaLayout from '../../src/components/maps/RutaLayout';

describe('RutaLayout', () => {

  // Creamos funciones "espía" para simular las props del componente.
  const mockNavigateHome = vi.fn();
  const mockRotarNorte = vi.fn();
  const mockBorrarRuta = vi.fn();
  const mockCenterOnUser = vi.fn();
  const mockToggleNavegacion = vi.fn();

  // Definimos un conjunto de props por defecto para usar en los tests.
  const defaultProps = {
    mapRef: { current: null },
    compassRef: { current: null },
    navigateHome: mockNavigateHome,
    rotarNorte: mockRotarNorte,
    borrarRuta: mockBorrarRuta,
    isCenter: false,
    isNavigating: false,
    centerOnUser: mockCenterOnUser,
    toggleNavegacion: mockToggleNavegacion,
  };

  // Antes de cada test, limpiamos el historial de llamadas de nuestras funciones espía.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debería mostrar todos los controles en su estado inicial', () => {
    render(<RutaLayout {...defaultProps} />);

    // Verificamos que todos los elementos esperados estén en pantalla.
    expect(document.querySelector('.ruta-map')).toBeInTheDocument();
    expect(screen.getByLabelText(/orientar al norte/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Borrar ruta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Centrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar/i })).toBeInTheDocument();
  });

  it('Debería llamar a las funciones correctas al hacer clic en los botones', () => {
    render(<RutaLayout {...defaultProps} />);

    // Simulamos clics y verificamos que se llamen las funciones correspondientes.
    fireEvent.click(document.querySelector('.boton-volver'));
    expect(mockNavigateHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/orientar al norte/i));
    expect(mockRotarNorte).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Borrar ruta/i }));
    expect(mockBorrarRuta).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Centrar/i }));
    expect(mockCenterOnUser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar/i }));
    expect(mockToggleNavegacion).toHaveBeenCalledTimes(1);
  });

  it('No debería mostrar el botón "Centrar" si el mapa ya está centrado', () => {
    // Renderizamos con la prop `isCenter` en true.
    render(<RutaLayout {...defaultProps} isCenter={true} />);

    // El botón "Centrar" no debería existir en el documento.
    expect(screen.queryByRole('button', { name: /Centrar/i })).toBeNull();
  });

  it('No debería mostrar el botón "Centrar" si la navegación está activa', () => {
    // Renderizamos con la prop `isNavigating` en true.
    render(<RutaLayout {...defaultProps} isNavigating={true} />);

    // El botón "Centrar" tampoco debería existir.
    expect(screen.queryByRole('button', { name: /Centrar/i })).toBeNull();
  });

  it('Debería cambiar el texto del botón de navegación a "Detener" cuando está navegando', () => {
    // Renderizamos con `isNavigating` en true.
    render(<RutaLayout {...defaultProps} isNavigating={true} />);
    
    // Verificamos que el botón ahora dice "Detener".
    const navButton = screen.getByRole('button', { name: /Detener/i });
    expect(navButton).toBeInTheDocument();
    
    // Y verificamos que tiene la clase correcta para el estilo de "peligro".
    expect(navButton).toHaveClass('danger');

    // También nos aseguramos de que el botón "Iniciar" ya no esté.
    expect(screen.queryByRole('button', { name: /Iniciar/i })).toBeNull();
  });
});