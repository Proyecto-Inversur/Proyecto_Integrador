import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppContent } from '../src/App';
import { AuthContext } from '../src/context/AuthContext';
import * as useAuthRoles from '../src/hooks/useAuthRoles';

// --- Mocks ---
vi.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }) => <div>{children}</div>,
}));

vi.mock('../src/components/Layout', () => ({ default: () => <div data-testid="layout"><Outlet /></div> }));
vi.mock('../src/pages/Login', () => ({ default: () => <div>Página de Login</div> }));

vi.mock('../src/routes', () => ({
  default: [
    { path: '/', element: <div>Página de Inicio</div> },
    { path: '/users', element: <div>Página de Usuarios (Admin)</div>, adminOnly: true },
  ],
}));


describe('Pruebas de Navegación y Rutas en App', () => {

  const mockUseAuthRoles = vi.spyOn(useAuthRoles, 'useAuthRoles');

  const renderAppContent = (authContextValue, initialRoute = '/') => {
    mockUseAuthRoles.mockReturnValue({
      id: authContextValue.currentEntity?.id,
      isAdmin: authContextValue.currentEntity?.rol === 'Administrador',
      isUser: authContextValue.currentEntity?.type === 'usuario',
    });

    return render(
      // Ahora envolvemos `AppContent`, que NO tiene un Router, dentro de nuestro MemoryRouter de prueba.
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={authContextValue}>
          <AppContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debería mostrar el spinner de carga si la autenticación está en proceso', () => {
    const authContextValue = { loading: true, verifying: false, currentEntity: null };
    renderAppContent(authContextValue);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('Debería redirigir a /login si un usuario no autenticado intenta acceder a una ruta protegida', async () => {
    const authContextValue = { loading: false, verifying: false, currentEntity: null };
    renderAppContent(authContextValue, '/');
    expect(await screen.findByText('Página de Login')).toBeInTheDocument();
  });

  it('Debería permitir el acceso a la página de inicio si el usuario está autenticado', async () => {
    const authContextValue = {
      loading: false,
      verifying: false,
      currentEntity: { id: 'user1', type: 'usuario', rol: 'Usuario' },
    };
    renderAppContent(authContextValue, '/');
    expect(await screen.findByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Página de Inicio')).toBeInTheDocument();
  });

  it('Debería redirigir a la página de inicio si un usuario autenticado navega a /login', async () => {
    const authContextValue = {
      loading: false,
      verifying: false,
      currentEntity: { id: 'user1', type: 'usuario', rol: 'Usuario' },
    };
    renderAppContent(authContextValue, '/login');
    expect(await screen.findByText('Página de Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Página de Login')).toBeNull();
  });

  it('NO debería permitir a un usuario normal acceder a una ruta de administrador', async () => {
    const authContextValue = {
      loading: false,
      verifying: false,
      currentEntity: { id: 'user1', type: 'usuario', rol: 'Usuario' },
    };
    renderAppContent(authContextValue, '/users');
    expect(await screen.findByText('Página de Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Página de Usuarios (Admin)')).toBeNull();
  });
});