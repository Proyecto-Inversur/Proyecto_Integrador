import React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CuadrillaForm from '@/components/forms/CuadrillaForm'
import { AuthContext } from '@/context/AuthContext'

// ---------- FIX: datos hoisted para usarlos dentro de los mocks ----------
const { ZONAS, NUEVA_ZONA } = vi.hoisted(() => ({
  ZONAS: [
    { id: 1, nombre: 'Zona 1' },
    { id: 2, nombre: 'Zona 2' },
    { id: 3, nombre: 'Zona 3' },
  ],
  NUEVA_ZONA: 'Zona Nueva',
}))

// ---------- Mocks de servicios ----------
vi.mock('@/services/zonaService', () => ({
  getZonas: vi.fn().mockResolvedValue({ data: ZONAS }),
  createZona: vi.fn().mockResolvedValue({ data: { id: 99, nombre: NUEVA_ZONA } }),
  deleteZona: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/services/cuadrillaService', () => ({
  createCuadrilla: vi.fn().mockResolvedValue({}),
  updateCuadrilla: vi.fn().mockResolvedValue({}),
}))

import * as zonaSvc from '@/services/zonaService'
import * as cuadSvc from '@/services/cuadrillaService'

<<<<<<< Updated upstream
// Helper para render con contexto
function renderWithProviders(ui: React.ReactNode, ctxOverrides: Partial<any> = {}) {
=======
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
>>>>>>> Stashed changes
  const signInWithGoogle = vi.fn().mockResolvedValue({
    idToken: 'token-google',
    email: 'cuadrilla@inversur.com',
  })
  const authValue = { signInWithGoogle, ...ctxOverrides }
  return {
    ...render(<AuthContext.Provider value={authValue as any}>{ui}</AuthContext.Provider>),
    authValue,
  }
}

<<<<<<< Updated upstream
describe('CuadrillaForm (genérico)', () => {
  const user = userEvent.setup()
  beforeEach(() => vi.clearAllMocks())
=======
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
>>>>>>> Stashed changes

  it('renderiza modo CREAR y deshabilita enviar sin datos', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    expect(await screen.findByText(/crear cuadrilla/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /seleccione una zona/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar con google/i })).toBeDisabled()
  })

<<<<<<< Updated upstream
  it('carga zonas y permite seleccionar una (sin depender de nombres reales)', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))
=======
  it('submitea creación correctamente (signIn + createCuadrilla + onClose)', async () => {
    cuadrillaService.createCuadrilla.mockResolvedValue({} as any);
    renderWithCtx();
>>>>>>> Stashed changes

    // Menú y items
    const menu = screen.getByText(ZONAS[0].nombre).closest('.dropdown-menu')!
    const items = within(menu).getAllByRole('button', { hidden: true })
    expect(items.length).toBeGreaterThanOrEqual(ZONAS.length) // Boton: + “Agregar nueva zona…”
    ZONAS.forEach(z => expect(screen.getByText(z.nombre)).toBeInTheDocument())

    await user.click(screen.getByText(ZONAS[1].nombre))
    expect(screen.getByRole('button', { name: ZONAS[1].nombre })).toBeInTheDocument()
  })

  it('“Agregar nueva zona…” muestra input, crea y selecciona la nueva zona', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(/agregar nueva zona/i))

    const input = await screen.findByPlaceholderText(/escriba la nueva zona/i)
    await user.type(input, NUEVA_ZONA)
    await user.click(screen.getByRole('button', { name: /^agregar$/i }))

    expect(zonaSvc.createZona).toHaveBeenCalledWith({ nombre: NUEVA_ZONA })
    expect(await screen.findByRole('button', { name: NUEVA_ZONA })).toBeInTheDocument()
  })

  it('elimina una zona (click en ×)', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: /seleccione una zona/i }))

    const item = screen.getByText(ZONAS[0].nombre).closest('.dropdown-item')!
    // Dentro del item hay un botón “×” adicional
    const btns = within(item).getAllByRole('button')
    await user.click(btns[btns.length - 1]) // Clic en “×”

<<<<<<< Updated upstream
    // Verifica que se llamó a deleteZona y que el item ya no está
    expect(zonaSvc.deleteZona).toHaveBeenCalledWith(ZONAS[0].id)
  })
=======
    renderWithCtx();
>>>>>>> Stashed changes

  it('GUARDA en modo CREAR usando Google y createCuadrilla', async () => {
    const onClose = vi.fn()
    const { authValue } = renderWithProviders(<CuadrillaForm onClose={onClose} />)

    await user.type(await screen.findByLabelText(/nombre/i), 'Cuadrilla X')
    await user.click(screen.getByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(ZONAS[0].nombre))

    await user.click(screen.getByRole('button', { name: /registrar con google/i }))

    expect(authValue.signInWithGoogle).toHaveBeenCalledWith(false)
    expect(cuadSvc.createCuadrilla).toHaveBeenCalledWith({
      nombre: 'Cuadrilla X',
      zona: ZONAS[0].nombre,
      email: 'cuadrilla@inversur.com',
      id_token: 'token-google',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('GUARDA en modo EDITAR llamando updateCuadrilla', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <CuadrillaForm onClose={onClose} cuadrilla={{ id: 7, nombre: 'Viejo', zona: ZONAS[0].nombre }} />
    )

    const nombre = await screen.findByLabelText(/nombre/i)
    await user.clear(nombre)
    await user.type(nombre, 'Editado')
    await user.click(screen.getByRole('button', { name: ZONAS[0].nombre }))
    await user.click(screen.getByText(ZONAS[2].nombre))

<<<<<<< Updated upstream
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))
=======
    renderWithCtx();
>>>>>>> Stashed changes

    expect(cuadSvc.updateCuadrilla).toHaveBeenCalledWith(7, { nombre: 'Editado', zona: ZONAS[2].nombre })
    expect(onClose).toHaveBeenCalled()
  })

  it('valida: el botón se habilita sólo si hay Nombre y Zona', async () => {
    renderWithProviders(<CuadrillaForm onClose={vi.fn()} />)
    const submit = await screen.findByRole('button', { name: /registrar con google/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/nombre/i), 'Equipo 1')
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /seleccione una zona/i }))
    await user.click(screen.getByText(ZONAS[1].nombre))
    expect(submit).toBeEnabled()
  })
})
