import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from '../../src/components/forms/UserForm';
import { AuthContext } from '../../src/context/AuthContext';
import * as userService from '../../src/services/userService';

vi.mock('../../src/services/userService', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

const renderWithAuth = (
  ui: React.ReactElement,
  ctx: Partial<React.ContextType<typeof AuthContext>> = {}
) => {
  const defaultCtx = {
    signInWithGoogle: vi.fn(),
    currentUser: null,
    currentEntity: null,
    loading: false,
    verifying: false,
    verifyUser: vi.fn(),
    logOut: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={{ ...defaultCtx, ...ctx }}>
      {ui}
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserForm', () => {
  it('crear usuario: integra Google, llama createUser y cierra', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue({
      idToken: 'tok-123',
      email: 'nuevo@demo.com',
    });
    const onClose = vi.fn();
    const setError = vi.fn();
    const setSuccess = vi.fn();
    const createUser = vi.spyOn(userService, 'createUser').mockResolvedValue({} as any);

    renderWithAuth(
      <UserForm user={null} onClose={onClose} setError={setError} setSuccess={setSuccess} />,
      { signInWithGoogle }
    );

    expect(screen.getByText(/crear usuario/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Nuevo Usuario');

    const submit = screen.getByRole('button', { name: /registrar con google/i });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledWith(false));
    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        nombre: 'Nuevo Usuario',
        rol: 'Administrador',
        email: 'nuevo@demo.com',
        id_token: 'tok-123',
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(setSuccess).toHaveBeenCalledWith('Usuario creado correctamente.');
  });

  it('editar usuario: actualiza datos existentes', async () => {
    const signInWithGoogle = vi.fn();
    const onClose = vi.fn();
    const setError = vi.fn();
    const setSuccess = vi.fn();
    const user = { id: 7, nombre: 'Tomi Administrador', rol: 'Administrador' };
    const updateUser = vi.spyOn(userService, 'updateUser').mockResolvedValue({} as any);

    renderWithAuth(
      <UserForm user={user} onClose={onClose} setError={setError} setSuccess={setSuccess} />,
      { signInWithGoogle }
    );

    expect(screen.getByText(/editar usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Tomi Administrador');

    await userEvent.clear(screen.getByLabelText(/nombre/i));
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Nombre Editado');
    await userEvent.selectOptions(
      screen.getByLabelText(/rol/i),
      'Encargado de Mantenimiento'
    );
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith(7, {
        nombre: 'Nombre Editado',
        rol: 'Encargado de Mantenimiento',
      })
    );
    expect(signInWithGoogle).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(setSuccess).toHaveBeenCalledWith('Usuario actualizado correctamente.');
  });

  it('valida: bot�n deshabilitado si falta el nombre', async () => {
    const signInWithGoogle = vi.fn();
    const setError = vi.fn();
    const setSuccess = vi.fn();

    renderWithAuth(
      <UserForm user={null} onClose={vi.fn()} setError={setError} setSuccess={setSuccess} />,
      { signInWithGoogle }
    );

    const submit = screen.getByRole('button', { name: /registrar con google/i });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Ada');
    expect(submit).toBeEnabled();
  });
});

