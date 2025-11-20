import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../src/pages/Login';
import { AuthContext } from '../../src/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock de dependencias
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mock de Firebase
vi.mock('../../src/services/firebase', () => ({
  auth: {},
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mock de la imagen con propiedad default
vi.mock('../../src/assets/logo_inversur.png', () => ({
  default: 'mocked-logo.png',
}));

// Función auxiliar para renderizar el componente con AuthContext
const renderWithAuthContext = (ui, authContextValue = {}, locationState = {}) => {
  useLocation.mockReturnValue({ state: locationState });
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Componente Login', () => {
  const mockNavigate = vi.fn();
  const mockSignInWithPopup = vi.fn();
  const mockSignOut = vi.fn();
  const mockVerifyUser = vi.fn();

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    mockSignInWithPopup.mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue('mock-token') },
    });
    mockSignOut.mockResolvedValue();
    mockVerifyUser.mockResolvedValue({ success: true });
  });

  // Prueba para verificar el renderizado por defecto (verifying: false)
  test('renderiza el logo, el botón de Google y el texto de copyright', () => {
    const authContextValue = {
      verifyUser: mockVerifyUser,
      verifying: false,
    };
    renderWithAuthContext(<Login />, authContextValue);

    // Verificamos que el logo se renderice
    const logo = screen.getByAltText(/Inversur Logo/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mocked-logo.png');

    // Verificamos que el botón de Google se renderice
    expect(screen.getByText(/Iniciar Sesión con Google/i)).toBeInTheDocument();

    // Verificamos el texto de copyright
    expect(screen.getByText(/Inversur © 2025/i)).toBeInTheDocument();
  });

  // Prueba para verificar el spinner cuando verifying es true
  test('muestra el spinner cuando se está verificando', () => {
    const authContextValue = {
      verifyUser: mockVerifyUser,
      verifying: true,
    };
    renderWithAuthContext(<Login />, authContextValue);

    // Verificamos que el spinner se renderice
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Verificando.../i)).toBeInTheDocument();

    // Verificamos que el logo se renderice
    const logo = screen.getByAltText(/Inversur Logo/i);
    expect(logo).toBeInTheDocument();

    // Verificamos que el botón de Google no se renderice
    expect(screen.queryByText(/Iniciar Sesión con Google/i)).toBeNull();
  });

  // Prueba para verificar el mensaje de error desde el estado
  test('muestra un mensaje de error si hay un error en location.state', () => {
    const authContextValue = {
      verifyUser: mockVerifyUser,
      verifying: false,
    };
    const locationState = { error: 'Error de autenticación' };
    renderWithAuthContext(<Login />, authContextValue, locationState);

    // Verificamos que el mensaje de error se renderice
    expect(screen.getByText(/Error de autenticación/i)).toBeInTheDocument();
  });

// Prueba de compatibilidad con pantallas pequeñas
  test('renderiza correctamente en pantallas pequeñas', () => {
    const authContextValue = {
      verifyUser: mockVerifyUser,
      verifying: false,
    };
    // Simulamos un tamaño de pantalla pequeño
    window.innerWidth = 320; // Ancho típico de móvil
    renderWithAuthContext(<Login />, authContextValue);

    // Verificamos que el recuadro y los elementos principales se rendericen
    const loginContainer = screen.getByText(/Inversur © 2025/i).closest('.login-container');
    expect(loginContainer).toBeInTheDocument();
    expect(screen.getByAltText(/Inversur Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar Sesión con Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Inversur © 2025/i)).toBeInTheDocument();
  });

});