import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BackButton from '../../src/components/BackButton';

// Mockeamos el hook useNavigate para poder espiar sus llamadas
vi.mock('react-router-dom', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    useNavigate: vi.fn(), // Creamos un mock para useNavigate
  };
});

describe('BackButton', () => {
  // Creamos una función espía (spy) que simulará ser `Maps`
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Antes de cada test, configuramos el mock para que devuelva nuestro espía
    // y limpiamos cualquier llamada anterior para que los tests no interfieran entre sí.
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    mockNavigate.mockClear();
  });

  const renderWithRouter = (props) => {
    return render(
      <MemoryRouter>
        <BackButton {...props} />
      </MemoryRouter>
    );
  };

  it('debería llamar a navigate con la ruta especificada en la prop "to"', () => {
    const testPath = '/home';
    renderWithRouter({ to: testPath });

    // Buscamos el botón por su rol y lo clickeamos
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verificamos que nuestro espía `Maps` fue llamado correctamente
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(testPath);
  });

  it('debería llamar a navigate con -1 cuando la prop "to" no es proporcionada', () => {
    renderWithRouter({}); // Renderizamos sin la prop 'to'

    // Buscamos y clickeamos el botón
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verificamos que `Maps` fue llamado para ir hacia atrás en el historial
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('debería renderizar el ícono de flecha izquierda', () => {
    renderWithRouter({});
    
    // Verificamos que el SVG del ícono está presente dentro del botón
    const button = screen.getByRole('button');
    const icon = button.querySelector('svg'); // Buscamos un elemento SVG
    
    expect(icon).toBeInTheDocument();
  });
});