import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClienteForm from '../../src/components/forms/ClienteForm';
import * as clienteService from '../../src/services/clienteService';

vi.mock('../../src/services/clienteService');

describe('Componente ClienteForm', () => {
  const createProps = () => ({
    show: true,
    cliente: null,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    setError: vi.fn(),
    setSuccess: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clienteService.createCliente).mockResolvedValue({ data: { id: 99 } });
    vi.mocked(clienteService.updateCliente).mockResolvedValue({ data: { id: 99 } });
  });

  it('Deber�a validar que todos los campos sean obligatorios antes de enviar', async () => {
    render(<ClienteForm {...createProps()} />);
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Cliente Test' } });
    fireEvent.change(screen.getByLabelText(/Contacto/i), { target: { value: 'Juan' } });
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    emailInput.required = false;
    emailInput.removeAttribute('required');

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(await screen.findByText('Todos los campos son obligatorios.')).toBeInTheDocument();
    expect(clienteService.createCliente).not.toHaveBeenCalled();
  });

  it('Deber�a crear un nuevo cliente cuando el formulario es v�lido', async () => {
    const props = createProps();
    render(<ClienteForm {...props} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Cliente Demo' } });
    fireEvent.change(screen.getByLabelText(/Contacto/i), { target: { value: 'Juan P�rez' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'demo@inversur.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(clienteService.createCliente).toHaveBeenCalledWith({
        nombre: 'Cliente Demo',
        contacto: 'Juan P�rez',
        email: 'demo@inversur.com',
      });
    });

    expect(props.setError).toHaveBeenCalledWith(null);
    expect(props.setSuccess).toHaveBeenCalledWith('Cliente creado correctamente.');
    expect(props.onSaved).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('Deber�a actualizar un cliente existente cuando se est� editando', async () => {
    const existingCliente = { id: 5, nombre: 'Cliente ACME', contacto: 'Laura', email: 'laura@acme.com' };
    const props = { ...createProps(), cliente: existingCliente };
    render(<ClienteForm {...props} />);

    expect(screen.getByDisplayValue('Cliente ACME')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Cliente ACME Editado' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(clienteService.updateCliente).toHaveBeenCalledWith(5, {
        nombre: 'Cliente ACME Editado',
        contacto: 'Laura',
        email: 'laura@acme.com',
      });
    });

    expect(props.setSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente.');
    expect(props.onSaved).toHaveBeenCalledTimes(1);
  });

  it('Deber�a mostrar un mensaje de error si la API devuelve un fallo', async () => {
    const apiError = { response: { data: { detail: 'Error al guardar' } } };
    vi.mocked(clienteService.createCliente).mockRejectedValueOnce(apiError);
    const props = createProps();

    render(<ClienteForm {...props} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Cliente Demo' } });
    fireEvent.change(screen.getByLabelText(/Contacto/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'demo@correo.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(props.setError).toHaveBeenCalledWith('Error al guardar');
    });

    expect(props.setSuccess).toHaveBeenCalledWith(null);
    expect(props.onSaved).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
