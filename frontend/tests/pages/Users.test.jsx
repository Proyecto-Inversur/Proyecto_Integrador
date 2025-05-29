import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Users from '../../src/pages/Users'; // Corrección del import
import * as userService from '../../services/userService';
import { AuthContext } from '../../context/AuthContext';

// Mock del servicio userService
vi.mock('../../services/userService');

// Mock de config.js para evitar el uso de window
vi.mock('../../src/config', () => ({
  getApiUrl: vi.fn(() => 'http://test-api.com'),
}));

// Mock de api.js para evitar dependencias adicionales
vi.mock('../../src/services/api', () => ({}));

describe('Users', () => {
  const mockAuthContext = {
    currentEntity: { type: 'usuario', data: { rol: 'Administrador' } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders table with users', async () => {
    userService.getUsers.mockResolvedValue({
      data: [{ id: 1, nombre: 'Juan', email: 'juan@example.com', rol: 'Administrador' }],
    });
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    await waitFor(() => expect(screen.getByText(/Juan/i)).toBeInTheDocument());
    expect(screen.getByText(/Gestión de Usuarios/i)).toBeInTheDocument();
  });

  test('opens form on add button click', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText(/Agregar/i));
    expect(screen.getByText(/Crear Usuario/i)).toBeInTheDocument();
  });

  test('deletes user successfully', async () => {
    userService.getUsers.mockResolvedValue({
      data: [{ id: 1, nombre: 'Juan', email: 'juan@example.com', rol: 'Administrador' }],
    });
    userService.deleteUser.mockResolvedValue();
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getAllByText(/Eliminar/i)[0]);
    await waitFor(() => expect(userService.deleteUser).toHaveBeenCalledWith(1));
  });
});