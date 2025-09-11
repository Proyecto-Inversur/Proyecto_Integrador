import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Sucursales from '../../src/pages/Sucursales';
import * as sucursalService from '../../src/services/sucursalService';
import * as zonaService from '../../src/services/zonaService';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/api');

// Mock servicios
vi.mock('../../src/services/sucursalService', () => ({
  getSucursales: vi.fn(),
  deleteSucursal: vi.fn(),
}));
vi.mock('../../src/services/zonaService', () => ({
  getZonas: vi.fn(),
}));

// Mock componente de formulario
vi.mock('../../src/components/SucursalForm', () => ({
  default: ({ sucursal, onClose }) => (
    <div data-testid="sucursal-form">
      <h3>{sucursal ? 'Editar Sucursal' : 'Crear Sucursal'}</h3>
      <button onClick={onClose}>Cerrar</button>
    </div>
  )
}));

const renderWithAuth = (ui, contextValue) => {
  const mockNavigate = vi.fn();
  useNavigate.mockReturnValue(mockNavigate);
  return {
    ...render(<AuthContext.Provider value={contextValue}>{ui}</AuthContext.Provider>),
    mockNavigate,
  };
};

describe('Página Sucursales', () => {
  const mockSucursales = [
    { id: 1, nombre: 'Sucursal Test', zona: 'Centro', direccion: 'Calle Falsa 123', superficie: '100' }
  ];
  const mockZonas = [{ id: 1, nombre: 'Centro' }];

  beforeEach(() => {
    vi.clearAllMocks();
    sucursalService.getSucursales.mockResolvedValue({ data: mockSucursales });
    sucursalService.deleteSucursal.mockResolvedValue({});
    zonaService.getZonas.mockResolvedValue({ data: mockZonas });
  });

  test('muestra sucursales en la tabla', async () => {
    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    expect(screen.getByText(/Gestión de Sucursales/i)).toBeInTheDocument();
    expect(screen.getByText(/Agregar/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sucursal Test')).toBeInTheDocument();
      expect(screen.getByText('Centro')).toBeInTheDocument();
    });
  });

  test('al hacer click en Agregar muestra el formulario', async () => {
    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Agregar/i));

    await waitFor(() => {
      expect(screen.getByTestId('sucursal-form')).toBeInTheDocument();
      expect(screen.getByText('Crear Sucursal')).toBeInTheDocument();
    });

  test('debería eliminar una sucursal', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [{ id: 1, nombre: 'Sucursal 1', zona: 'Zona A', direccion: 'Calle 123', superficie: '100' }],
    });
    sucursalService.deleteSucursal.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    const eliminarButton = await screen.findByRole('button', { name: /Eliminar/i });
    fireEvent.click(eliminarButton);

    await waitFor(() => {
      expect(screen.queryByTestId('sucursal-form')).not.toBeInTheDocument();
    });
  });

  it('redirecciona si no hay entidad en el contexto', () => {
    const { mockNavigate } = renderWithAuth(<Sucursales />, { currentEntity: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirecciona si el tipo de entidad no es usuario', () => {
    const { mockNavigate } = renderWithAuth(<Sucursales />, { currentEntity: { type: 'admin' } });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('elimina una sucursal al hacer clic en "Eliminar"', async () => {
    const auth = { currentEntity: { type: 'usuario' } };
    const { getSucursales, deleteSucursal } = require('../../src/services/sucursalService');

    renderWithAuth(<Sucursales />, auth);

    await waitFor(() => screen.getByText('Sucursal Test'));

    const btnEliminar = screen.getByText('Eliminar');
    fireEvent.click(btnEliminar);

    await waitFor(() => {
      expect(deleteSucursal).toHaveBeenCalledWith(1);
    });

    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Sucursal Test')).not.toBeInTheDocument();
    });
  });
});


