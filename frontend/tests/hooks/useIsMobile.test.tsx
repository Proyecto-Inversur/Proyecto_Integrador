import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useIsMobile from '../../src/hooks/useIsMobile';

// Función auxiliar para establecer el tamaño de la ventana
const setWindowWidth = (width) => {
  // `vi.spyOn` nos permite modificar una propiedad de un objeto, en este caso `innerWidth`.
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(width);
  // Disparamos manualmente el evento 'resize' para que el hook lo escuche.
  window.dispatchEvent(new Event('resize'));
};

describe('Hook: useIsMobile', () => {

  // Guardamos las implementaciones originales para restaurarlas después.
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    // Restauramos los listeners antes de cada test para que no interfieran entre sí.
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it('Debería devolver "true" si el ancho inicial de la ventana es de móvil', () => {
    // Establecemos un ancho de pantalla de móvil.
    setWindowWidth(500);

    // `renderHook` ejecuta el hook en un entorno de prueba.
    const { result } = renderHook(() => useIsMobile());

    // Verificamos que el valor inicial sea correcto.
    expect(result.current).toBe(true);
  });

  it('Debería devolver "false" si el ancho inicial de la ventana es de escritorio', () => {
    // Establecemos un ancho de pantalla de escritorio.
    setWindowWidth(1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('Debería actualizarse de "escritorio" a "móvil" cuando cambia el tamaño de la ventana', () => {
    // Empezamos en modo escritorio.
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // `act` envuelve cualquier acción que cause una actualización de estado en React.
    act(() => {
      // Simulamos que el usuario redimensiona la ventana a un tamaño de móvil.
      setWindowWidth(600);
    });
    
    // Verificamos que el valor del hook se haya actualizado a `true`.
    expect(result.current).toBe(true);
  });

  it('Debería actualizarse de "móvil" a "escritorio" cuando cambia el tamaño de la ventana', () => {
    // Empezamos en modo móvil.
    setWindowWidth(700);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      // Simulamos que el usuario redimensiona la ventana a un tamaño de escritorio.
      setWindowWidth(900);
    });
    
    // Verificamos que el valor del hook se haya actualizado a `false`.
    expect(result.current).toBe(false);
  });

  it('Debería limpiar el event listener al desmontar el componente', () => {
    // Creamos "espías" para saber si `addEventListener` y `removeEventListener` son llamados.
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    // `unmount` es una función que nos da `renderHook` para simular que el componente desaparece.
    const { unmount } = renderHook(() => useIsMobile());

    // Verificamos que el listener se añadió al montar el hook.
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    // Desmontamos el componente.
    unmount();

    // Verificamos que el listener se eliminó, lo que prueba que la función de limpieza del `useEffect` funcionó.
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});