import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomeButton from '../../src/components/HomeButton';
import { useAuthRoles } from '../../src/hooks/useAuthRoles';
import { FiHome } from 'react-icons/fi'; // Usamos un ícono real para el test

// Simulamos el hook useAuthRoles. Esto nos permite controlar su salida en cada test.
vi.mock('../../src/hooks/useAuthRoles');

describe('HomeButton', () => {

  // Antes de cada test, limpiamos los mocks para asegurar que las pruebas no se afecten entre sí.
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // Función auxiliar para renderizar el componente dentro del contexto de Router.
  const renderWithRouter = (props) => {
    return render(
      <MemoryRouter>
        <HomeButton icon={FiHome} to="/test" {...props}>
          Botón de Prueba
        </HomeButton>
      </MemoryRouter>
    );
  };

  it('Debería mostrar el botón si no se requieren roles específicos', () => {
    // Simulamos un usuario sin rol de admin.
    vi.mocked(useAuthRoles).mockReturnValue({ isAdmin: false, isUser: true, isCuadrilla: false });
    
    // Renderizamos el botón sin la prop `requiredRoles`.
    renderWithRouter({ requiredRoles: [] });

    // El botón debería estar visible.
    expect(screen.getByRole('link', { name: /Botón de Prueba/i })).toBeInTheDocument();
  });

  it('Debería mostrar el botón si el usuario tiene el rol requerido (admin)', () => {
    // Simulamos un usuario que es administrador.
    vi.mocked(useAuthRoles).mockReturnValue({ isAdmin: true, isUser: true, isCuadrilla: false });
    
    // El botón requiere el rol 'admin'.
    renderWithRouter({ requiredRoles: ['admin'] });

    // El botón debería estar visible.
    expect(screen.getByRole('link', { name: /Botón de Prueba/i })).toBeInTheDocument();
  });

  it('NO debería mostrar el botón si el usuario NO tiene el rol requerido', () => {
    // Simulamos un usuario que NO es administrador.
    vi.mocked(useAuthRoles).mockReturnValue({ isAdmin: false, isUser: true, isCuadrilla: false });
    
    // El botón requiere el rol 'admin'.
    renderWithRouter({ requiredRoles: ['admin'] });

    // Usamos `queryByRole` porque esperamos que el elemento NO exista.
    // `getByRole` daría un error, que es más difícil de testear.
    expect(screen.queryByRole('link', { name: /Botón de Prueba/i })).toBeNull();
  });

  it('Debería mostrar el botón si el usuario tiene UNO de los múltiples roles requeridos', () => {
    // Simulamos un usuario que es cuadrilla, pero no admin.
    vi.mocked(useAuthRoles).mockReturnValue({ isAdmin: false, isUser: false, isCuadrilla: true });
    
    // El botón requiere ser 'admin' O 'cuadrilla'.
    renderWithRouter({ requiredRoles: ['admin', 'cuadrilla'] });

    // El botón debería estar visible porque el usuario cumple con uno de los roles.
    expect(screen.getByRole('link', { name: /Botón de Prueba/i })).toBeInTheDocument();
  });
  
  it('Debería renderizar como un Link con el ícono y el texto correctos', () => {
    vi.mocked(useAuthRoles).mockReturnValue({ isAdmin: true, isUser: true, isCuadrilla: false });
    renderWithRouter({ to: '/ruta-especifica' });

    const buttonLink = screen.getByRole('link', { name: /Botón de Prueba/i });
    
    // Verificamos que es un link que apunta a la ruta correcta.
    expect(buttonLink).toHaveAttribute('href', '/ruta-especifica');
    
    // Verificamos que el texto (children) está dentro del link.
    expect(buttonLink).toHaveTextContent('Botón de Prueba');
    
    // Verificamos que el ícono (un SVG en este caso) está renderizado dentro del link.
    const icon = buttonLink.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});