import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SucursalForm from '../../src/components/forms/SucursalForm';
import * as zonaService from '../../src/services/zonaService';
import * as sucursalService from '../../src/services/sucursalService';

// --- Mocks ---
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/sucursalService');

// Botón que simula la selección.
vi.mock('../../src/components/DireccionAutocomplete', () => ({
  default: ({ onSelect }) => (
    <button
      data-testid="direccion-selector"
      onClick={() => onSelect({ address: 'Calle Falsa 123, Córdoba', lat: -31.4, lng: -64.1 })}
    >
      Seleccionar Dirección
    </button>
  ),
}));

describe('Formulario de Sucursal (SucursalForm)', () => {
  const sucursalMock = {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: { address: 'Calle Falsa 123, Córdoba', lat: -31.4, lng: -64.1 },
    zona: 'Zona 1',
    superficie: '300',
  };
  
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: [{id: 1, nombre: 'Zona 1'}] });
    vi.mocked(sucursalService.createSucursal).mockResolvedValue({ data: { id: 2 } });
    vi.mocked(sucursalService.updateSucursal).mockResolvedValue({ data: sucursalMock });
  });

  test('Debería renderizar el formulario en modo "Crear" y cargar las zonas', async () => {
    render(<SucursalForm onClose={mockOnClose} />);
    expect(await screen.findByText('Crear Sucursal')).toBeInTheDocument();
    expect(zonaService.getZonas).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
  });

  test('Debería renderizar el formulario en modo "Editar" con los datos prellenados', async () => {
    render(<SucursalForm sucursal={sucursalMock} onClose={mockOnClose} />);
    expect(await screen.findByText('Editar Sucursal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByText('Zona 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    expect(await screen.findByText(/Seleccionado: Calle Falsa 123, Córdoba/i)).toBeInTheDocument();
  });

  test('Debería permitir completar y enviar el formulario para crear una nueva sucursal', async () => {
    render(<SucursalForm onClose={mockOnClose} />);
    
    const nombreInput = await screen.findByLabelText(/Nombre/i);

    fireEvent.change(nombreInput, { target: { value: 'Nueva Sucursal' } });
    fireEvent.change(screen.getByLabelText(/Superficie/i), { target: { value: '500' } });
    
    // Hacemos clic en el botón de nuestro nuevo mock.
    fireEvent.click(screen.getByTestId('direccion-selector'));

    // Esperamos a que la UI se actualice con el texto de la dirección seleccionada.
    await screen.findByText(/Seleccionado: Calle Falsa 123, Córdoba/i);

    // Ahora que el estado está actualizado, continuamos con el test.
    fireEvent.click(screen.getByText(/Seleccione una zona/i));
    fireEvent.click(await screen.findByText('Zona 1'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(sucursalService.createSucursal).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('Debería llamar a updateSucursal al guardar los cambios en modo edición', async () => {
    render(<SucursalForm sucursal={sucursalMock} onClose={mockOnClose} />);
    
    const nombreInput = await screen.findByDisplayValue('Sucursal Centro');
    
    fireEvent.change(nombreInput, { target: { value: 'Sucursal Centro Editada' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));
    
    await waitFor(() => {
      expect(sucursalService.updateSucursal).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('NO debería enviar el formulario si no se ha seleccionado una dirección válida', async () => {
    render(<SucursalForm onClose={mockOnClose} />);
    
    await screen.findByLabelText(/Nombre/i);
    
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Sin Dirección' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(await screen.findByText('Debe proporcionar coordenadas válidas.')).toBeInTheDocument();
    expect(sucursalService.createSucursal).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});