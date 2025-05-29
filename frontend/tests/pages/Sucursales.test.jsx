import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Sucursales from '../../src/pages/Sucursales';
import { AuthContext } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock navegación
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

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
    const sucursalService = require('../../src/services/sucursalService');
    const zonaService = require('../../src/services/zonaService');
    sucursalService.getSucursales.mockResolvedValue({ data: mockSucursales });
    sucursalService.deleteSucursal.mockResolvedValue({});
    zonaService.getZonas.mockResolvedValue({ data: mockZonas });
  });

  it('renderiza la UI base', async () => {
    const auth = { currentEntity: { type: 'usuario' } };
    renderWithAuth(<Sucursales />, auth);

    expect(screen.getByText(/Gestión de Sucursales/i)).toBeInTheDocument();
    expect(screen.getByText(/Agregar/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sucursal Test')).toBeInTheDocument();
      expect(screen.getByText('Centro')).toBeInTheDocument();
    });
  });

  it('abre y cierra el formulario de creación', async () => {
    const auth = { currentEntity: { type: 'usuario' } };
    renderWithAuth(<Sucursales />, auth);

    fireEvent.click(screen.getByText(/Agregar/i));

    await waitFor(() => {
      expect(screen.getByTestId('sucursal-form')).toBeInTheDocument();
      expect(screen.getByText('Crear Sucursal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cerrar'));

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

    // Simula refresco de datos vacío
    getSucursales.mockResolvedValueOnce({ data: [] });

    await waitFor(() => {
      expect(screen.queryByText('Sucursal Test')).not.toBeInTheDocument();
    });
  });
});
