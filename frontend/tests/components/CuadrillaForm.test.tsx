import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import CuadrillaForm from '../../src/components/forms/CuadrillaForm';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import { AuthContext } from '../../src/context/AuthContext';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// ---- Firebase: evita efectos reales
vi.mock('../../src/services/firebase', () => {
  const mockUser = {
    uid: 'mock-user-id',
    email: 'test@example.com',
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
  };
  return {
    auth: { currentUser: null },
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((_auth, cb) => {
      cb(null);
      return () => {};
    }),
    GoogleAuthProvider: vi.fn(() => ({})),
    signInWithPopup: vi.fn().mockResolvedValue({ user: mockUser }),
    linkWithPopup: vi.fn(),
  };
});

vi.mock('react-bootstrap', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const Dropdown = ({ show, onToggle, children }: any) => {
    const [open, setOpen] = React.useState(!!show);
    const toggle = () => {
      const next = !open;
      setOpen(next);
      onToggle?.(next);
    };
    const kids = React.Children.toArray(children) as any[];
    const toggleChild = kids.find((c: any) => c.type?.displayName === 'DropdownToggle') ?? kids[0];
    const menuChild = kids.find((c: any) => c.type?.displayName === 'DropdownMenu') ?? kids[1];

    return (
      <div data-testid="dropdown">
        {toggleChild &&
          React.cloneElement(toggleChild, {
            onClick: (e: any) => {
              toggleChild.props?.onClick?.(e);
              toggle();
            },
          })}
        {open && menuChild && (
          <div data-testid="dropdown-menu">{menuChild.props.children}</div>
        )}
      </div>
    );
  };
  const Toggle = ({ id, className, children, onClick }: any) => (
    <button id={id} className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
  Toggle.displayName = 'DropdownToggle';

  const Menu = ({ className, children }: any) => (
    <div className={className}>{children}</div>
  );
  Menu.displayName = 'DropdownMenu';

  const Item = ({ className, children, onClick }: any) => (
    <div role="menuitem" className={className} onClick={onClick}>
      {children}
    </div>
  );

  Dropdown.Toggle = Toggle;
  Dropdown.Menu = Menu;
  Dropdown.Item = Item;

  return { ...actual, Dropdown };
});

// ---- Servicios HTTP
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/api');

describe('CuadrillaForm', () => {
  const onClose = vi.fn();
  const setError = vi.fn();
  const setSuccess = vi.fn();
  const signInWithGoogle = vi.fn().mockResolvedValue({
    idToken: 'mock-token',
    email: 'test@example.com',
  });

  const renderWithCtx = (props: Record<string, any> = {}) =>
    render(
      <AuthContext.Provider
        value={{
          signInWithGoogle, 
          currentUser: null,
          currentEntity: null,
          loading: false,
          verifying: false,
          verifyUser: vi.fn(),
        }}
      >
        <CuadrillaForm
          onClose={onClose}
          setError={setError}
          setSuccess={setSuccess}
          {...props}
        />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    zonaService.getZonas.mockResolvedValue({
      data: [{ id: 1, nombre: 'Nueva Cordoba' }],
    } as any);
  });

  it('submitea creación correctamente (signIn + createCuadrilla + onClose)', async () => {
    cuadrillaService.createCuadrilla.mockResolvedValue({} as any);
    renderWithCtx();

    // 1) Esperar a que termine el loading inicial
    //    (mientras está el spinner no existe el formulario)
    const spinner = screen.getByRole('status');
    await waitForElementToBeRemoved(spinner);

    // 2) Interactuar con el formulario ya visible
    await userEvent.type(await screen.findByLabelText(/Nombre/i), 'Cuadrilla 1');

    await userEvent.click(
      await screen.findByRole('button', { name: /Seleccione una zona/i })
    );

    const itemZona = await screen.findByText('Nueva Cordoba');
    await userEvent.click(itemZona); // setea formData.zona

    const submit = await screen.findByRole('button', { name: /Registrar con Google/i });
    expect(submit).not.toBeDisabled();
    await userEvent.click(submit);

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledWith(false);
      expect(cuadrillaService.createCuadrilla).toHaveBeenCalledWith({
        nombre: 'Cuadrilla 1',
        zona: 'Nueva Cordoba',
        email: 'test@example.com',
        id_token: 'mock-token',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('elimina una zona', async () => {
    zonaService.deleteZona.mockResolvedValue({} as any);

    renderWithCtx();

    // esperar a que se vaya el spinner
    await waitForElementToBeRemoved(screen.getByRole('status'));

    await userEvent.click(
      await screen.findByRole('button', { name: /Seleccione una zona/i })
    );

    const zonaItem = await screen.findByText('Nueva Cordoba');
    const deleteBtn = zonaItem
      .closest('.custom-dropdown-item')
      ?.querySelector('button.custom-delete-button') as HTMLButtonElement | null;

    expect(deleteBtn).not.toBeNull();
    await userEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(zonaService.deleteZona).toHaveBeenCalledWith(1);
    });
  });

  it('agrega una nueva zona', async () => {
    zonaService.createZona.mockResolvedValue({ data: { id: 2, nombre: 'Nueva Zona' } } as any);

    renderWithCtx();

    await waitForElementToBeRemoved(screen.getByRole('status'));

    await userEvent.click(
      await screen.findByRole('button', { name: /Seleccione una zona/i })
    );

    // Click en "Agregar nueva zona..."
    const addItem = await screen.findByText((t) => /Agregar nueva zona/i.test(t));
    await userEvent.click(addItem);

    // Aparece el input y el botón "Agregar"
    const input = await screen.findByPlaceholderText(/Escriba la nueva zona/i);
    await userEvent.type(input, 'Nueva Zona');

    const addBtn = screen.getByRole('button', { name: /^Agregar$/i });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(zonaService.createZona).toHaveBeenCalledWith({ nombre: 'Nueva Zona' });
      expect(screen.getByText(/Nueva Zona/i)).toBeInTheDocument();
    });
  });
});
