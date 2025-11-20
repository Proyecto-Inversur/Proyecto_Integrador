import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as mantenimientoCorrectivoService from '../../src/services/mantenimientoCorrectivoService';
import * as clienteService from '../../src/services/clienteService';
import MantenimientoCorrectivoForm from '../../src/components/forms/MantenimientoCorrectivoForm';

vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/mantenimientoCorrectivoService');
vi.mock('../../src/services/clienteService');

describe('MantenimientoCorrectivoForm', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onClose = vi.fn();
  const setError = vi.fn();
  const setSuccess = vi.fn();

  const CLIENTES = [{ id: 1, nombre: 'Cliente Uno' }];
  const CUADRILLAS = [
    { id: 201, nombre: 'Cuadrilla 1' },
    { id: 202, nombre: 'Cuadrilla 2' },
  ];
  const SUCURSALES = {
    1: [
      { id: 101, nombre: 'Sucursal A', cliente_id: 1, zona: 'Norte' },
      { id: 102, nombre: 'Sucursal B', cliente_id: 1, zona: 'Sur' },
    ],
  };

  const MANTENIMIENTO_EXISTENTE = {
    id: 7,
    id_sucursal: 101,
    cliente_id: 1,
    id_cuadrilla: 201,
    fecha_apertura: '2025-08-09T00:00:00',
    numero_caso: '101',
    incidente: 'Alarma',
    rubro: 'Mobiliario',
    estado: 'Presupuestado',
    prioridad: 'Baja',
  };

  const renderForm = (props: Record<string, any> = {}) =>
    render(
      <MantenimientoCorrectivoForm
        onClose={onClose}
        setError={setError}
        setSuccess={setSuccess}
        {...props}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();

    vi.mocked(clienteService.getClientes).mockResolvedValue({ data: CLIENTES });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: CUADRILLAS });
    vi.mocked(sucursalService.getSucursalesByCliente).mockImplementation(async (clienteId: number) => ({
      data: SUCURSALES[clienteId] || [],
    }));
    vi.mocked(mantenimientoCorrectivoService.createMantenimientoCorrectivo).mockResolvedValue({});
    vi.mocked(mantenimientoCorrectivoService.updateMantenimientoCorrectivo).mockResolvedValue({});
  });

  const waitForForm = async () => {
    await waitFor(() => {
      expect(clienteService.getClientes).toHaveBeenCalled();
      expect(cuadrillaService.getCuadrillas).toHaveBeenCalled();
    });
    await screen.findByText(/Mantenimiento Correctivo/i);
  };

  it('Deber�a renderizar en modo CREAR y deshabilitar el bot�n de Guardar inicialmente', async () => {
    renderForm();
    await waitForForm();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
  });

  it('Deber�a permitir crear un mantenimiento cuando se completan los campos', async () => {
    renderForm();
    await waitForForm();

    await user.selectOptions(screen.getByLabelText(/Cliente/i), '1');
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '102');
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '202');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-08-11');
    await user.type(screen.getByLabelText(/N.?mero de Caso/i), '123');
    await user.type(screen.getByLabelText(/Incidente/i), 'Falla general');
    await user.selectOptions(screen.getByLabelText(/Rubro/i), 'Otros');

    const guardarButton = screen.getByRole('button', { name: /Guardar/i });
    expect(guardarButton).toBeEnabled();
    await user.click(guardarButton);

    await waitFor(() => {
      expect(mantenimientoCorrectivoService.createMantenimientoCorrectivo).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente_id: 1,
          id_sucursal: '102',
          id_cuadrilla: '202',
          numero_caso: '123',
          incidente: 'Falla general',
          rubro: 'Otros',
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Deber�a permitir editar un mantenimiento existente', async () => {
    renderForm({ mantenimiento: MANTENIMIENTO_EXISTENTE });
    await waitForForm();

    const numeroCasoInput = screen.getByLabelText(/N.?mero de Caso/i);
    await user.clear(numeroCasoInput);
    await user.type(numeroCasoInput, '999');
    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mantenimientoCorrectivoService.updateMantenimientoCorrectivo).toHaveBeenCalledWith(
        MANTENIMIENTO_EXISTENTE.id,
        expect.objectContaining({ numero_caso: '999' })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Deber�a mantener el bot�n deshabilitado si faltan campos obligatorios', async () => {
    renderForm();
    await waitForForm();

    await user.selectOptions(screen.getByLabelText(/Cliente/i), '1');
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '101');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-08-11');

    const guardarButton = screen.getByRole('button', { name: /Guardar/i });
    expect(guardarButton).toBeDisabled();
    await user.click(guardarButton);

    expect(mantenimientoCorrectivoService.createMantenimientoCorrectivo).not.toHaveBeenCalled();
  });
});

