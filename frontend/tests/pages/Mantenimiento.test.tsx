import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Mantenimiento from '../../src/pages/Mantenimiento';
import { AuthContext } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock de dependencias
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  Link: vi.fn().mockImplementation(({ to, children, ...props }) => (
    <a href={to} onClick={(e) => e.preventDefault()} {...props}>
      {children}
    </a>
  )),
}));

// Mock de los íconos para evitar errores
vi.mock('react-icons/fa', () => ({
  FaTruck: () => <span>FaTruck</span>,
  FaHome: () => <span>FaHome</span>,
  FaCalendarAlt: () => <span>FaCalendarAlt</span>,
  FaWrench: () => <span>FaWrench</span>,
  FaTools: () => <span>FaTools</span>,
}));

// Función auxiliar para renderizar el componente con AuthContext
const renderWithAuthContext = (ui, authContextValue = {}) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Componente Mantenimiento', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  // Prueba para verificar el renderizado y las rutas con un usuario autenticado
  test('renderiza los botones y verifica las rutas para un usuario autenticado', () => {
    const authContextValue = {
      currentEntity: { type: 'usuario' },
    };
    renderWithAuthContext(<Mantenimiento />, authContextValue);

    // Verificamos que el contenedor se renderice
    const container = screen.getByText(/Cuadrillas/i).closest('.home-container');
    expect(container).toBeInTheDocument();

    // Verificamos que todos los botones se rendericen
    const buttons = [
      { text: 'Cuadrillas', route: '/cuadrillas' },
      { text: 'Sucursales', route: '/sucursales' },
      { text: 'Preventivos', route: '/preventivos' },
      { text: 'Mantenimiento Correctivo', route: '/mantenimientos-correctivos' },
      { text: 'Mantenimiento Preventivo', route: '/mantenimientos-preventivos' },
    ];

    buttons.forEach(({ text, route }) => {
      const button = screen.getByText(text);
      expect(button).toBeInTheDocument();

      // Verificamos que el enlace tenga la ruta correcta
      expect(button.closest('a')).toHaveAttribute('href', route);
    });
  });
});
