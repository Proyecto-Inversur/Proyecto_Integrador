import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clienteService from '../../src/services/clienteService';
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
import MantenimientoPreventivoForm from '../../src/components/forms/MantenimientoPreventivoForm';

vi.mock('../../src/services/clienteService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/mantenimientoPreventivoService');

describe('MantenimientoPreventivoForm', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onClose = vi.fn();
  const setError = vi.fn();
  const setSuccess = vi.fn();

  const CLIENTES = [{ id: 1, nombre: 'Cliente Uno' }];
  const CUADRILLAS = [{ id: 10, nombre: 'Cuadrilla Norte' }];
  const SUCURSALES = {
    1: [
      { id: 101, nombre: 'Sucursal Centro', frecuencia_preventivo: 'Mensual' },
      { id: 102, nombre: 'Sucursal Norte', frecuencia_preventivo: '' },
    ],
  };

  const EXISTING = {
    id: 5,
    cliente_id: 1,
    id_sucursal: 101,
    id_cuadrilla: 10,
    fecha_apertura: '2025-10-05T00:00:00',
    estado: 'En Progreso',
    frecuencia: 'Mensual',
  };

  const renderForm = (props: Record<string, any> = {}) =>
    render(
      <MantenimientoPreventivoForm
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
    vi.mocked(mantenimientoPreventivoService.createMantenimientoPreventivo).mockResolvedValue({});
    vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo).mockResolvedValue({});
  });

  const waitForReady = async () => {
    await waitFor(() => {
      expect(clienteService.getClientes).toHaveBeenCalled();
      expect(cuadrillaService.getCuadrillas).toHaveBeenCalled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  };

  it('renderiza en modo CREAR y muestra spinner mientras carga', async () => {
    renderForm();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitForReady();
    expect(screen.getByLabelText(/Cliente/i)).toBeInTheDocument();
  });

  it('permite crear un mantenimiento cuando la sucursal tiene frecuencia configurada', async () => {
    renderForm();
    await waitForReady();

    await user.selectOptions(screen.getByLabelText(/Cliente/i), '1');
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '101');
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '10');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-12-01');
    await user.selectOptions(screen.getByLabelText(/Estado/i), 'Finalizado');
    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mantenimientoPreventivoService.createMantenimientoPreventivo).toHaveBeenCalled();
    });

    const payload = vi.mocked(mantenimientoPreventivoService.createMantenimientoPreventivo).mock.calls[0][0];
    expect(payload).toMatchObject({
      cliente_id: 1,
      id_sucursal: 101,
      id_cuadrilla: 10,
      fecha_apertura: '2025-12-01',
      estado: 'Finalizado',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('evita crear un mantenimiento si la sucursal no tiene frecuencia', async () => {
    renderForm();
    await waitForReady();

    await user.selectOptions(screen.getByLabelText(/Cliente/i), '1');
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '102');
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '10');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-12-01');
    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(screen.getByText(/no tiene mantenimiento preventivo configurado/i)).toBeInTheDocument();
    expect(mantenimientoPreventivoService.createMantenimientoPreventivo).not.toHaveBeenCalled();
  });

  it('prellena los datos en modo edici�n y actualiza el mantenimiento', async () => {
    renderForm({ mantenimiento: EXISTING });
    await waitForReady();

    expect(screen.getByLabelText(/Fecha Apertura/i)).toHaveValue('2025-10-05');
    await user.selectOptions(screen.getByLabelText(/Estado/i), 'Finalizado');
    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).toHaveBeenCalledWith(
        EXISTING.id,
        expect.objectContaining({ estado: 'Finalizado' })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

