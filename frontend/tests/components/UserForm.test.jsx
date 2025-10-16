import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserForm from '../../src/components/UserForm';
import * as userService from '../../src/services/userService';
import { AuthContext } from '../../src/context/AuthContext';

// Mocks
vi.mock('../../src/services/userService');

// Helper para renderizar con AuthContext
const renderWithAuthContext = (ui, authContextValue = {}) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('UserForm', () => {
  const mockOnClose = vi.fn();
  const mockSignInWithGoogle = vi.fn();

  const authContextValue = {
    signInWithGoogleForRegistration: mockSignInWithGoogle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuramos el mock para que devuelva un objeto con idToken
    mockSignInWithGoogle.mockResolvedValue({ idToken: 'mock-id-token' });
  });

  test('Representa correctamente el formulario de creación para el registro de Google', () => {
    renderWithAuthContext(<UserForm onClose={mockOnClose} />, authContextValue);

    expect(screen.getByText(/Crear Usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument();
    expect(screen.getByText(/Registrar con Google/i)).toBeInTheDocument();
  });

  test('Envía el formulario de registro de Google correctamente', async () => {
    renderWithAuthContext(<UserForm onClose={mockOnClose} />, authContextValue);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Rol/i), { target: { value: 'Encargado de Mantenimiento' } });

    // Simulamos el clic en "Registrar con Google"
    fireEvent.click(screen.getByText(/Registrar con Google/i));

    // Verificamos que se llamó a signInWithGoogleForRegistration y onClose
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});