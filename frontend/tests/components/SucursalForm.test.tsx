import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SucursalForm from '../../src/components/forms/SucursalForm';
import * as zonaService from '../../src/services/zonaService';
import * as sucursalService from '../../src/services/sucursalService';

vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/sucursalService');

vi.mock('../../src/components/DireccionAutocomplete', () => ({
  default: ({ onSelect }) => (
    <button
      data-testid="direccion-selector"
      onClick={() => onSelect({ address: 'Calle Falsa 123, C�rdoba', lat: -31.4, lng: -64.1 })}
    >
      Seleccionar Direcci�n
    </button>
  ),
}));

describe('Formulario de Sucursal (SucursalForm)', () => {
  const sucursalMock = {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: { address: 'Calle Falsa 123, C�rdoba', lat: -31.4, lng: -64.1 },
    zona: 'Zona 1',
    superficie: '300',
    frecuencia_preventivo: 'Mensual',
  };

  const renderForm = (props: Record<string, any> = {}) => {
    const onClose = vi.fn();
    const setError = vi.fn();
    const setSuccess = vi.fn();
    const defaultProps = { clienteId: 1, ...props };
    return {
      onClose,
      setError,
      setSuccess,
      ...render(
        <SucursalForm
          onClose={onClose}
          setError={setError}
          setSuccess={setSuccess}
          {...defaultProps}
        />
      ),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(zonaService.getZonas).mockResolvedValue({ data: [{ id: 1, nombre: 'Zona 1' }] });
    vi.mocked(sucursalService.createSucursal).mockResolvedValue({ data: { id: 2 } });
    vi.mocked(sucursalService.updateSucursal).mockResolvedValue({ data: sucursalMock });
  });

  test('Deber�a renderizar el formulario en modo "Crear" y cargar las zonas', async () => {
    renderForm();
    expect(await screen.findByText('Crear Sucursal')).toBeInTheDocument();
    expect(zonaService.getZonas).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
  });

  test('Deber�a renderizar el formulario en modo "Editar" con los datos prellenados', async () => {
    renderForm({ sucursal: sucursalMock });
    expect(await screen.findByText('Editar Sucursal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zona 1' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    expect(await screen.findByText(/Seleccionado: Calle Falsa 123, C�rdoba/i)).toBeInTheDocument();
  });

  test('Deber�a permitir completar y enviar el formulario para crear una nueva sucursal', async () => {
    const { onClose } = renderForm();

    fireEvent.change(await screen.findByLabelText(/Nombre/i), { target: { value: 'Nueva Sucursal' } });
    fireEvent.change(screen.getByLabelText(/Superficie/i), { target: { value: '500' } });
    fireEvent.click(screen.getByTestId('direccion-selector'));
    await screen.findByText(/Seleccionado: Calle Falsa 123, C�rdoba/i);

    fireEvent.click(screen.getByRole('button', { name: /Seleccione una zona/i }));
    fireEvent.click(await screen.findByText('Zona 1'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(sucursalService.createSucursal).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nombre: 'Nueva Sucursal',
          zona: 'Zona 1',
          direccion: expect.objectContaining({ address: 'Calle Falsa 123, C�rdoba' }),
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('Deber�a llamar a updateSucursal al guardar los cambios en modo edici�n', async () => {
    const { onClose } = renderForm({ sucursal: sucursalMock });

    const nombreInput = await screen.findByDisplayValue('Sucursal Centro');
    fireEvent.change(nombreInput, { target: { value: 'Sucursal Centro Editada' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(sucursalService.updateSucursal).toHaveBeenCalledWith(
        sucursalMock.id,
        expect.objectContaining({ nombre: 'Sucursal Centro Editada' })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('NO deber�a enviar el formulario si no se ha seleccionado una direcci�n v�lida', async () => {
    const { setError } = renderForm();
    await screen.findByLabelText(/Nombre/i);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Sin Direcci�n' } });
    fireEvent.click(screen.getByRole('button', { name: /Seleccione una zona/i }));
    fireEvent.click(await screen.findByText('Zona 1'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => expect(setError).toHaveBeenCalled());
    const lastCall = setError.mock.calls.at(-1);
    const errorMsg = lastCall ? lastCall[0] : '';
    expect(String(errorMsg)).toMatch(/Debe seleccionar/i);
    expect(sucursalService.createSucursal).not.toHaveBeenCalled();
  });
});
