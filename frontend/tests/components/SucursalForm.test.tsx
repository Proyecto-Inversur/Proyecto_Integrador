import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { waitForElementToBeRemoved } from '@testing-library/react'
import SucursalForm from '../../src/components/forms/SucursalForm';
import * as zonaService from '../../src/services/zonaService';
import * as sucursalService from '../../src/services/sucursalService';


// Mocks
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/api');
vi.mock('../../src/components/DireccionAutocomplete', () => ({
  default: ({ onSelect }) => (
    <input
      placeholder="Escriba una dirección"
      onChange={() => onSelect({ address: 'Calle Falsa 123', lat: 1, lng: 1 })}
    />
  ),
}));

describe('SucursalForm component', () => {
  const sucursalMock = {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: 'Calle Falsa 123',
    zona: 'Zona 1',
    superficie: 300,
  };
  
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    zonaService.getZonas.mockResolvedValue({ data: [] });
  });

  test('renderiza correctamente el formulario para crear', async () => {
    render(<SucursalForm onClose={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Escriba una dirección/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Superficie/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Crear Sucursal')).toBeInTheDocument();
  });

  test('permite completar y enviar el formulario', async () => {
    sucursalService.createSucursal.mockResolvedValue({});

    render(<SucursalForm onClose={mockOnSave} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Nueva' } });
    fireEvent.change(screen.getByPlaceholderText(/Escriba una dirección/i), { target: { value: 'Calle Falsa 123' } });
    fireEvent.change(screen.getByLabelText(/Superficie/i), { target: { value: '300' } });

    fireEvent.click(screen.getByText(/Seleccione una zona/i));
    await waitFor(() => expect(screen.getByText(/Agregar nueva zona/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Agregar nueva zona/i));

    const newZonaInput = screen.getByPlaceholderText(/Escriba la nueva zona/i);
    fireEvent.change(newZonaInput, { target: { value: 'Zona 1' } });

    zonaService.createZona.mockResolvedValue({ data: { id: 1, nombre: 'Zona 1' } });

    fireEvent.click(screen.getByText(/^Agregar$/));

    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  test('debería renderizar el formulario de edición con datos prellenados', async () => {
    render(<SucursalForm sucursal={sucursalMock} />);
    
    expect(screen.getByDisplayValue('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByText('Zona 1')).toBeInTheDocument();
    expect(screen.getByText(/Seleccionado: Calle Falsa 123/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });
  
  test('debería permitir actualizar una sucursal existente', async () => {
    sucursalService.updateSucursal.mockResolvedValue({});
    
    render(<SucursalForm sucursal={sucursalMock} onClose={mockOnSave} />);
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Editada' } });
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
  
  test('debería permitir agregar una nueva zona', async () => {
    zonaService.createZona.mockResolvedValue({ data: { id: 2, nombre: 'Zona Nueva' } });
  
    render(<SucursalForm />);
    fireEvent.click(screen.getByText(/Seleccione una zona/i));
    fireEvent.click(screen.getByText(/Agregar nueva zona/i));
  
    fireEvent.change(screen.getByPlaceholderText(/Escriba la nueva zona/i), {
      target: { value: 'Zona Nueva' },
    });
  
    fireEvent.click(screen.getByText(/^Agregar$/));
  
    await waitFor(() => {
      expect(zonaService.createZona).toHaveBeenCalledWith({ nombre: 'Zona Nueva' });
      expect(screen.getByDisplayValue('Zona Nueva')).toBeInTheDocument();
    });
  });
  
  test('debería mostrar error al intentar crear una zona existente', async () => {
    zonaService.createZona.mockRejectedValue({
      response: { data: { detail: 'La zona ya existe' } },
    });
  
    render(<SucursalForm />);
    fireEvent.click(screen.getByText(/Seleccione una zona/i));
    fireEvent.click(screen.getByText(/Agregar nueva zona/i));
    fireEvent.change(screen.getByPlaceholderText(/Escriba la nueva zona/i), {
      target: { value: 'Zona Existente' },
    });
    fireEvent.click(screen.getByText(/^Agregar$/));
  
    await waitFor(() =>
      expect(screen.getByText(/Error al crear la zona/i)).toBeInTheDocument()
    );
  });
  
  test('no debería permitir enviar el formulario sin campos requeridos', async () => {
    render(<SucursalForm />);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  
    await waitFor(() => {
      expect(sucursalService.createSucursal).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});

