import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useUsers from '../../src/hooks/forms/useUsers';
import * as userService from '../../src/services/userService';

vi.mock('../../src/services/userService');

describe('Hook: useUsers', () => {
  const mockUsersData = [
    { id: 1, nombre: 'Usuario Alfa' },
    { id: 2, nombre: 'Usuario Beta' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getUsers).mockResolvedValue({ data: mockUsersData });
    vi.mocked(userService.deleteUser).mockResolvedValue({});
  });

  it('Deber�a empezar en estado de carga y luego obtener los usuarios', async () => {
    const { result } = renderHook(() => useUsers());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(userService.getUsers).toHaveBeenCalledTimes(1);
    expect(result.current.users).toEqual(mockUsersData);
    expect(result.current.error).toBeNull();
  });

  it('Deber�a manejar un error al cargar los usuarios', async () => {
    const errorMessage = 'Error de red';
    vi.mocked(userService.getUsers).mockRejectedValueOnce({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.users).toEqual([]);
  });

  it('Deber�a actualizar el estado para editar un usuario', async () => {
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleEdit(mockUsersData[0]);
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.selectedUser).toEqual(mockUsersData[0]);
  });

  it('Deber�a resetear el estado y recargar los datos al cerrar el formulario', async () => {
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleEdit(mockUsersData[0]);
    });
    
    await act(async () => {
      await result.current.handleFormClose();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.selectedUser).toBeNull();
    expect(userService.getUsers).toHaveBeenCalledTimes(2);
  });

  it('Deber�a llamar a deleteUser y recargar los datos al eliminar', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(1);
    });
    
    expect(userService.deleteUser).toHaveBeenCalledWith(1);
    expect(userService.getUsers).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });
});

