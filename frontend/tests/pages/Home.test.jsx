import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../src/pages/Home';
import { AuthContext } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock de dependencias
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  Link: vi.fn().mockImplementation(({ children }) => <a>{children}</a>), // Mock de Link para renderizar texto
}));

// Función auxiliar para renderizar el componente con AuthContext
const renderWithAuthContext = (ui, authContextValue = {}) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Componente Home', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  // Prueba para verificar que los botones se rendericen con un usuario administrador
  test('renderiza los botones de navegación con un usuario administrador', () => {
    const authContextValue = {
      currentEntity: {
        type: 'usuario',
        data: { rol: 'Administrador' },
      },
    };
    renderWithAuthContext(<Home />, authContextValue);

    const buttons = ['Usuarios', 'Mantenimiento', 'Mapa', 'Reportes'];
    buttons.forEach((buttonText) => {
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });
  });

  // Prueba para verificar que los botones se rendericen con un usuario no administrador
  test('renderiza los botones de navegación con un usuario no administrador', () => {
    const authContextValue = {
      currentEntity: {
        type: 'usuario',
        data: { rol: 'Operador' },
      },
    };
    renderWithAuthContext(<Home />, authContextValue);

    const buttons = ['Mantenimiento', 'Mapa']; // Solo estos se deberían renderizar
    buttons.forEach((buttonText) => {
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    // Verificamos que "Usuarios" y "Reportes" no se rendericen
    expect(screen.queryByText('Usuarios')).toBeNull();
    expect(screen.queryByText('Reportes')).toBeNull();
  });

  // Prueba para verificar la redirección a login si no hay currentEntity
  test('navega a login si no hay currentEntity', () => {
    const authContextValue = { currentEntity: null };
    renderWithAuthContext(<Home />, authContextValue);

    // Verificamos que se navega a /login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});