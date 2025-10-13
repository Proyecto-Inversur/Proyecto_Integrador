// frontend/tests/pages/Mantenimiento.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Mantenimiento from '../../src/pages/Mantenimiento';

// --- Mocks ---

// Simulamos los componentes hijos para probar la página de forma aislada.
// Esto evita que necesitemos probar también la lógica interna de BackButton y HomeButton aquí.
vi.mock('../../src/components/BackButton', () => ({ 
    default: () => <div data-testid="back-button" /> 
}));

// El mock de HomeButton crea un link simple y expone las props `to` y `requiredRoles`
// para que podamos verificarlas en el test.
vi.mock('../../src/components/HomeButton', () => ({
  default: ({ to, children, requiredRoles }) => (
    <a href={to} data-roles={requiredRoles}>
      {children}
    </a>
  ),
}));


describe('Página de Mantenimiento', () => {

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <Mantenimiento />
      </MemoryRouter>
    );
  };

  it('Debería mostrar todos los botones de navegación', () => {
    renderWithRouter();

    // Verificamos que el botón de volver esté presente.
    expect(screen.getByTestId('back-button')).toBeInTheDocument();

    // Verificamos que todos los botones de navegación principal estén visibles por su texto.
    expect(screen.getByRole('link', { name: /Cuadrillas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sucursales/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mantenimiento Correctivo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mantenimiento Preventivo/i })).toBeInTheDocument();
  });

  it('Debería asignar las rutas y roles correctos a cada botón', () => {
    renderWithRouter();

    // Buscamos cada botón por su texto y verificamos sus atributos.
    const cuadrillasButton = screen.getByRole('link', { name: /Cuadrillas/i });
    expect(cuadrillasButton).toHaveAttribute('href', '/cuadrillas');
    expect(cuadrillasButton).toHaveAttribute('data-roles', 'user');

    const sucursalesButton = screen.getByRole('link', { name: /Sucursales/i });
    expect(sucursalesButton).toHaveAttribute('href', '/sucursales');
    expect(sucursalesButton).toHaveAttribute('data-roles', 'user');
    
    const correctivoButton = screen.getByRole('link', { name: /Mantenimiento Correctivo/i });
    expect(correctivoButton).toHaveAttribute('href', '/mantenimientos-correctivos');
    // Este botón no tiene `requiredRoles`, por lo que el atributo no debería existir.
    expect(correctivoButton).not.toHaveAttribute('data-roles');

    const preventivoButton = screen.getByRole('link', { name: /Mantenimiento Preventivo/i });
    expect(preventivoButton).toHaveAttribute('href', '/mantenimientos-preventivos');
    expect(preventivoButton).not.toHaveAttribute('data-roles');
  });
});