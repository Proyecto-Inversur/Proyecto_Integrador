// frontend/tests/components/ProtectedRoute.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { AuthContext } from '../../src/context/AuthContext';
import * as useAuthRoles from '../../src/hooks/useAuthRoles';

// Simulamos el hook useAuthRoles para controlar sus valores en los tests.
vi.mock('../../src/hooks/useAuthRoles');

// Contenido de prueba que se renderizará si la ruta es accesible.
const ProtectedContent = () => <div>Contenido Protegido</div>;
const HomePage = () => <div>Página de Inicio</div>;
const LoginPage = () => <div>Página de Login</div>;

describe('ProtectedRoute', () => {

  // Función auxiliar para renderizar el componente con contextos y rutas simuladas.
  const renderProtectedRoute = (authContextValue, authRolesValue, routeProps) => {
    // Simulamos la salida del hook useAuthRoles.
    vi.spyOn(useAuthRoles, 'useAuthRoles').mockReturnValue(authRolesValue);

    return render(
      <AuthContext.Provider value={authContextValue}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute {...routeProps}>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('Debería mostrar el spinner mientras carga la información de autenticación', () => {
    renderProtectedRoute(
      { loading: true, verifying: false }, // Contexto de Auth
      { id: null, isAdmin: false, isUser: false }, // Roles (no importa en este caso)
      {} // Props de la ruta
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('Debería redirigir a /login si el usuario no está autenticado', () => {
    renderProtectedRoute(
      { loading: false, verifying: false },
      { id: null, isAdmin: false, isUser: false },
      {}
    );

    // Verificamos que se muestra el contenido de la página de login.
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    // Y que el contenido protegido NO se muestra.
    expect(screen.queryByText('Contenido Protegido')).toBeNull();
  });

  it('Debería redirigir a / si un usuario no-admin intenta acceder a una ruta de admin', () => {
    renderProtectedRoute(
      { loading: false, verifying: false },
      { id: 'user1', isAdmin: false, isUser: true }, // Usuario normal
      { adminOnly: true } // La ruta requiere ser admin
    );

    expect(screen.getByText('Página de Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).toBeNull();
  });
  
  it('Debería redirigir a / si un no-usuario intenta acceder a una ruta de usuario', () => {
    renderProtectedRoute(
      { loading: false, verifying: false },
      { id: 'user1', isAdmin: false, isUser: false }, // No es `isUser`
      { usersOnly: true } // La ruta requiere ser `isUser`
    );

    expect(screen.getByText('Página de Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).toBeNull();
  });

  it('Debería mostrar el contenido protegido si el usuario tiene los permisos correctos', () => {
    renderProtectedRoute(
      { loading: false, verifying: false },
      { id: 'admin1', isAdmin: true, isUser: true }, // Usuario admin
      { adminOnly: true } // La ruta requiere ser admin
    );

    // Verificamos que el contenido protegido SÍ se muestra.
    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });
});