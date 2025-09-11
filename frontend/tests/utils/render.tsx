// tests/utils/render.tsx
import React, { PropsWithChildren } from 'react'
import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/context/AuthContext'

type AuthMock = Partial<React.ContextType<typeof AuthContext>>

export function renderWithProviders(
  ui: React.ReactElement,
  {
    route = '/',
    auth = { currentEntity: 'admin' } as AuthMock,
  }: { route?: string; auth?: AuthMock } = {}
) {
  window.history.pushState({}, 'Test page', route)

  const Wrapper = ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={auth as any}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </AuthContext.Provider>
  )

  return rtlRender(ui, { wrapper: Wrapper })
}
