import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import Login from '@/pages/Login'
import { AuthContext } from '@/context/AuthContext'

const mockSignInWithGoogle = vi.fn()
const mockLogOut = vi.fn()

function renderWithAuth(
  ui: React.ReactElement,
  {
    verifying = false,
    route = '/',
    locationState,
  }: { verifying?: boolean; route?: string; locationState?: any } = {},
) {
  // MemoryRouter permite pasar state inicial en v6
  const entry = typeof locationState !== 'undefined'
    ? { pathname: route, state: locationState }
    : route

  const authValue = {
    verifying,
    signInWithGoogle: mockSignInWithGoogle,
    logOut: mockLogOut,
  } as any

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[entry as any]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra spinner cuando verifying = true', () => {
    renderWithAuth(<Login />, { verifying: true })

    // role="status" + texto oculto "Verificando..."
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/verificando/i)).toBeInTheDocument()

    // No debería estar el botón aún
    expect(screen.queryByRole('button', { name: /iniciar sesión con google/i })).not.toBeInTheDocument()
  })

  it('render normal: muestra logo y botón de Google habilitado', () => {
    renderWithAuth(<Login />)

    expect(screen.getByAltText(/inversur logo/i)).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toBeEnabled()
  })

  it('al clickear, llama signInWithGoogle(true)', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({})
    const user = userEvent.setup()

    renderWithAuth(<Login />)

    await user.click(screen.getByRole('button', { name: /iniciar sesión con google/i }))
    expect(mockSignInWithGoogle).toHaveBeenCalledWith(true)
    expect(mockLogOut).not.toHaveBeenCalled()
    // no esperamos navegación aquí porque el componente no navega; lo maneja AuthProvider/Router
  })

  it('si el login falla, muestra Alert y llama logOut con el mensaje', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('Fallo de Google'))
    const user = userEvent.setup()

    renderWithAuth(<Login />)

    await user.click(screen.getByRole('button', { name: /iniciar sesión con google/i }))

    await waitFor(() => {
      expect(screen.getByText(/fallo de google/i)).toBeInTheDocument()
      expect(mockLogOut).toHaveBeenCalledWith('Fallo de Google')
    })
  })

  it('muestra el error proveniente de location.state.error', () => {
    renderWithAuth(<Login />, { locationState: { error: 'Sesión expirada' } })

    expect(screen.getByText(/sesión expirada/i)).toBeInTheDocument()
    // El botón sigue disponible
    expect(screen.getByRole('button', { name: /iniciar sesión con google/i })).toBeInTheDocument()
  })
}) 
