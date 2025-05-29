import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar.jsx';
import { AuthContext } from '../../src/context/AuthContext.jsx';
import * as firebase from '../../src/services/firebase.js';
import * as api from '../../src/services/api.js';
import userEvent from '@testing-library/user-event';

// Mock de Firebase
vi.mock('../../src/services/firebase.js', () => ({
  auth: {},
  signOut: vi.fn().mockResolvedValue(),
  onAuthStateChanged: vi.fn((auth, callback) => callback({ uid: '123' })),
}));

// Mock de la API
vi.mock('../../src/services/api.js', () => ({
  getNotifications: vi.fn().mockResolvedValue([
    { id: 1, message: 'Nueva obra asignada a Cuadrilla #1' },
    { id: 2, message: 'Mantenimiento preventivo programado' },
    { id: 3, message: 'Usuario Juan Pérez actualizó su perfil' },
  ]),
  logout: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock de localStorage
beforeEach(() => {
  window.localStorage = {
    getItem: vi.fn(() => 'mock-auth-token'), // Simula un token válido
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Navbar Component', () => {
  const renderWithContextAndRouter = (authContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  test('renderiza los links de navegación para administrador', () => {
    const authContextValue = {
      currentUser: { uid: '123' },
      currentEntity: { type: 'usuario', data: { rol: 'Administrador' } },
      loading: false,
    };

    renderWithContextAndRouter(authContextValue);

    const adminLinks = [
      'Usuarios',
      'Sucursales',
      'Cuadrillas',
      'Preventivos',
      'Mantenimientos Preventivos',
      'Mantenimientos Correctivos',
      'Mapa',
      'Reportes',
    ];

    adminLinks.forEach((linkText) => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });

  test('renderiza solo links básicos para usuario no administrador', () => {
    const authContextValue = {
      currentUser: { uid: '123' },
      currentEntity: { type: 'usuario', data: { rol: 'Encargado de Mantenimiento' } },
      loading: false,
    };

    renderWithContextAndRouter(authContextValue);

    const basicLinks = [
      'Sucursales',
      'Cuadrillas',
      'Preventivos',
      'Mantenimientos Preventivos',
      'Mantenimientos Correctivos',
      'Mapa',
    ];

    basicLinks.forEach((linkText) => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });

    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Reportes')).not.toBeInTheDocument();
  });

  test('abre el modal de notificaciones al hacer clic en el botón', async () => {
    const authContextValue = {
      currentUser: { uid: '123' },
      currentEntity: { type: 'usuario', data: { rol: 'Administrador' } },
      loading: false,
    };

    renderWithContextAndRouter(authContextValue);

    // Buscar el botón con aria-label o role
    const notificationsButton = screen.getByLabelText('Notificaciones');

    await act(async () => {
      userEvent.click(notificationsButton);
    });

    // Esperar a que el modal se abra y verifique el título
    await waitFor(() => {
      expect(screen.getByText(/Notificaciones/i)).toBeInTheDocument();
    });

    // Verificar que una notificación está renderizada
    expect(screen.getByText(/Nueva obra asignada a Cuadrilla #1/i)).toBeInTheDocument();
  });

  test('muestra el botón de cerrar sesión dentro del modal de notificaciones', async () => {
    const authContextValue = {
      currentUser: { uid: '123' },
      currentEntity: { type: 'usuario', data: { rol: 'Administrador' } },
      loading: false,
    };

    renderWithContextAndRouter(authContextValue);

    // Buscar el botón de notificaciones
    const notificationButton = screen.getByLabelText('Notificaciones');

    // Abrir el modal
    await act(async () => {
      await userEvent.click(notificationButton);
    });

    // Esperar a que el modal se abra y verificar que el botón "Cerrar Sesión" esté presente
    await waitFor(() => {
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });
  });
});