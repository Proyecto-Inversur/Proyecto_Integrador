import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useCuadrillas from '../../src/hooks/forms/useCuadrillas';
import * as cuadrillaService from '../../src/services/cuadrillaService';

vi.mock('../../src/services/cuadrillaService');

describe('Hook: useCuadrillas', () => {
  const mockCuadrillasData = [
    { id: 1, nombre: 'Cuadrilla Alfa' },
    { id: 2, nombre: 'Cuadrilla Beta' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: mockCuadrillasData });
    vi.mocked(cuadrillaService.deleteCuadrilla).mockResolvedValue({});
  });

  it('Deber�a empezar en estado de carga y luego obtener las cuadrillas', async () => {
    const { result } = renderHook(() => useCuadrillas());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(1);
    expect(result.current.cuadrillas).toEqual(mockCuadrillasData);
    expect(result.current.error).toBeNull();
  });

  it('Deber�a manejar correctamente un error al cargar las cuadrillas', async () => {
    const errorMessage = 'Error de red';
    vi.mocked(cuadrillaService.getCuadrillas).mockRejectedValueOnce({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useCuadrillas());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.cuadrillas).toEqual([]);
  });

  it('Deber�a actualizar el estado para editar una cuadrilla', () => {
    const { result } = renderHook(() => useCuadrillas());
    const cuadrillaParaEditar = mockCuadrillasData[0];

    act(() => {
      result.current.handleEdit(cuadrillaParaEditar);
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.selectedCuadrilla).toEqual(cuadrillaParaEditar);
  });

  it('Deber�a resetear el estado y recargar los datos al cerrar el formulario', async () => {
    const { result } = renderHook(() => useCuadrillas());

    act(() => {
      result.current.handleEdit(mockCuadrillasData[0]);
    });

    await act(async () => {
      result.current.handleFormClose();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.selectedCuadrilla).toBeNull();
    expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(2);
  });

  it('Deber�a llamar a deleteCuadrilla y recargar los datos al eliminar', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useCuadrillas());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(cuadrillaService.deleteCuadrilla).toHaveBeenCalledWith(1);
    expect(cuadrillaService.getCuadrillas).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });
});

