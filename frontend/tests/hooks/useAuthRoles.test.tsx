import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthContext } from '../../src/context/AuthContext';
import useAuthRoles from '../../src/hooks/useAuthRoles';

// Helper que envuelve el hook con un provider del contexto
const wrapperWithValue =
  (value: any) =>
  ({ children }: { children: React.ReactNode }) =>
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

describe('useAuthRoles', () => {
  it('retorna flags y datos correctos para un usuario administrador', () => {
    const currentEntity = {
      type: 'usuario',
      data: { id: 1, uid: 'u1', nombre: 'Juan', rol: 'Administrador' },
    };

    const { result } = renderHook(() => useAuthRoles(), {
      wrapper: wrapperWithValue({ currentEntity }),
    });

    expect(result.current).toEqual({
      id: 1,
      uid: 'u1',
      nombre: 'Juan',
      isUser: true,
      isCuadrilla: false,
      isAdmin: true,
    });
  });

  it('retorna flags correctos para un usuario normal (no admin)', () => {
    const currentEntity = {
      type: 'usuario',
      data: { id: 2, uid: 'u2', nombre: 'Pedro', rol: 'Operario' },
    };

    const { result } = renderHook(() => useAuthRoles(), {
      wrapper: wrapperWithValue({ currentEntity }),
    });

    expect(result.current.isUser).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isCuadrilla).toBe(false);
    expect(result.current.nombre).toBe('Pedro');
  });

  it('retorna flags correctos para una cuadrilla', () => {
    const currentEntity = {
      type: 'cuadrilla',
      data: { id: 5, uid: 'c5', nombre: 'Cuadrilla Norte' },
    };

    const { result } = renderHook(() => useAuthRoles(), {
      wrapper: wrapperWithValue({ currentEntity }),
    });

    expect(result.current.isCuadrilla).toBe(true);
    expect(result.current.isUser).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.nombre).toBe('Cuadrilla Norte');
  });

  it('retorna todos los flags en false y datos undefined si no hay entidad', () => {
    const { result } = renderHook(() => useAuthRoles(), {
      wrapper: wrapperWithValue({ currentEntity: null }),
    });

    expect(result.current.isUser).toBe(false);
    expect(result.current.isCuadrilla).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.id).toBeUndefined();
    expect(result.current.uid).toBeUndefined();
    expect(result.current.nombre).toBeUndefined();
  });
});