import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import BackButton from '@/components/BackButton'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('BackButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra el label correctamente', () => {
    render(
      <MemoryRouter>
        <BackButton label="Volver" />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })

  it('navega a la ruta indicada cuando recibe "to"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BackButton to="/home" label="Volver" />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /volver/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/home')
  })

  it('navega hacia atrás cuando no recibe "to"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BackButton label="Volver" />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /volver/i }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
