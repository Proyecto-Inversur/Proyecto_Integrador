import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Cuadrillas from '../../src/pages/Cuadrillas.jsx';
import { AuthContext } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock de dependencias
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock de cuadrillaService para evitar interacciones con el backend
vi.mock('../../src/services/cuadrillaService', () => ({
  getCuadrillas: vi.fn(),
  deleteCuadrilla: vi.fn(),
}));

// Mock de CuadrillaForm para evitar solicitudes HTTP
vi.mock('../../src/components/CuadrillaForm.jsx', () => ({
  default: () => <div>CuadrillaForm Mock</div>, // Simulamos un render básico
}));

// Función auxiliar para renderizar el componente con AuthContext
const renderWithAuthContext = (ui, authContextValue = {}) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Cuadrillas', () => {
  const mockNavigate = vi.fn();
  const mockGetCuadrillas = vi.fn();
  const mockDeleteCuadrilla = vi.fn();

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    mockGetCuadrillas.mockResolvedValue({ data: [] }); // Por defecto, tabla vacía
    mockDeleteCuadrilla.mockResolvedValue();
  });

  // Prueba para verificar que la tabla se renderice con encabezados y el botón "Agregar"
  test('renderiza la tabla con encabezados y el botón agregar', async () => {
    const authContextValue = { currentEntity: { type: 'usuario' } };
    renderWithAuthContext(<Cuadrillas />, authContextValue);

    await waitFor(() => {
      // Verificamos el título y el botón "Agregar"
      expect(screen.getByText(/Gestión de Cuadrillas/i)).toBeInTheDocument();
      expect(screen.getByText(/Agregar/i)).toBeInTheDocument();

      // Verificamos que la tabla se renderice
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verificamos los encabezados de la tabla
      const headers = table.querySelectorAll('thead th');
      expect(headers.length).toBe(5);
      expect(headers[0]).toHaveTextContent(/ID/i);
      expect(headers[1]).toHaveTextContent(/Nombre/i);
      expect(headers[2]).toHaveTextContent(/Zona/i);
      expect(headers[3]).toHaveTextContent(/Email/i);
      expect(headers[4]).toHaveTextContent(/Acciones/i);
    });
  });


  // Prueba para verificar la navegación a home si currentEntity no es usuario
  test('navega a home si currentEntity no es usuario', () => {
    const authContextValue = { currentEntity: { type: 'admin' } };
    renderWithAuthContext(<Cuadrillas />, authContextValue);

    // Verificamos que se navega a /
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
