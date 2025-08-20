import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Home from '@/pages/Home'           // <-- ajusta si tu path es distinto
import { AuthContext } from '@/context/AuthContext'

function renderWithAuth(currentEntity: any | null) {
  return render(
    <AuthContext.Provider value={{ currentEntity } as any}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('Home', () => {
  it('usuario Administrador: muestra Usuarios, Mantenimiento, Mapa (/mapa) y Reportes', () => {
    const entity = { type: 'usuario', data: { rol: 'Administrador' } }
    renderWithAuth(entity)

    const usuarios = screen.getByRole('link', { name: /usuarios/i })
    const mantenimiento = screen.getByRole('link', { name: /mantenimiento/i })
    const mapa = screen.getByRole('link', { name: /mapa/i })
    const reportes = screen.getByRole('link', { name: /reportes/i })

    expect(usuarios).toHaveAttribute('href', '/users')
    expect(mantenimiento).toHaveAttribute('href', '/mantenimiento')
    expect(mapa).toHaveAttribute('href', '/mapa')
    expect(reportes).toHaveAttribute('href', '/reportes')
  })

  it('usuario NO administrador: muestra Mantenimiento y Mapa (/mapa); NO muestra Usuarios ni Reportes', () => {
    const entity = { type: 'usuario', data: { rol: 'Operador' } }
    renderWithAuth(entity)

    expect(screen.getByRole('link', { name: /mantenimiento/i })).toHaveAttribute('href', '/mantenimiento')
    expect(screen.getByRole('link', { name: /mapa/i })).toHaveAttribute('href', '/mapa')

    expect(screen.queryByRole('link', { name: /usuarios/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /reportes/i })).toBeNull()
  })

  it('cuadrilla: muestra Mantenimiento y Mapa (/ruta); NO muestra Usuarios ni Reportes', () => {
    const entity = { type: 'cuadrilla', data: { rol: 'X' } }
    renderWithAuth(entity)

    expect(screen.getByRole('link', { name: /mantenimiento/i })).toHaveAttribute('href', '/mantenimiento')
    // para cuadrilla el enlace de Mapa va a /ruta
    expect(screen.getByRole('link', { name: /mapa/i })).toHaveAttribute('href', '/ruta')

    expect(screen.queryByRole('link', { name: /usuarios/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /reportes/i })).toBeNull()
  })

  it('sin sesión (currentEntity null): no muestra botones', () => {
    renderWithAuth(null)

    expect(screen.queryByRole('link', { name: /usuarios/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /mantenimiento/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /mapa/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /reportes/i })).toBeNull()
  })
})
