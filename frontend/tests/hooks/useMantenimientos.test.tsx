import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useMantenimientos from '../../src/hooks/mantenimientos/useMantenimientos';

describe('Hook: useMantenimientos', () => {
    
    // Preparo los datos que el hook recibiría como argumentos.
    const mockSucursales = [{ id: 101, nombre: 'Sucursal A', zona: 'Norte' }];
    const mockCuadrillas = [{ id: 201, nombre: 'Cuadrilla Alfa' }];
    const mockClientes = [{ id: 1, nombre: 'Cliente Demo' }];
    const mockAddToRoute = vi.fn();
    const mockRemoveFromRoute = vi.fn();

    it('Debería manejar la apertura y cierre del modal de imágenes', () => {
        const { result } = renderHook(() => useMantenimientos());

        // Inicialmente, el modal está cerrado.
        expect(result.current.showModal).toBe(false);
        expect(result.current.selectedImage).toBeNull();

        // Simulo el clic en una imagen.
        act(() => {
            result.current.handleImageClick('url-de-imagen.jpg');
        });

        // Verifico que el estado se actualice para mostrar el modal.
        expect(result.current.showModal).toBe(true);
        expect(result.current.selectedImage).toBe('url-de-imagen.jpg');

        // Simulo el cierre del modal.
        act(() => {
            result.current.handleCloseModal();
        });

        // Verifico que el estado se resetee.
        expect(result.current.showModal).toBe(false);
        expect(result.current.selectedImage).toBeNull();
    });

    it('Debería llamar a addToRoute cuando se activa toggleRoute y no está seleccionado', () => {
        const setIsSelected = vi.fn();
        const { result } = renderHook(() => useMantenimientos([], [], [], false, setIsSelected, mockAddToRoute, vi.fn()));

        act(() => {
            result.current.toggleRoute();
        });

        // Verifico que se llamó a la función para agregar a la ruta.
        expect(mockAddToRoute).toHaveBeenCalledTimes(1);
        // Verifico que se intentó actualizar el estado a "seleccionado".
        expect(setIsSelected).toHaveBeenCalledWith(true);
    });

    it('Debería llamar a removeFromRoute cuando se activa toggleRoute y ya está seleccionado', () => {
        const setIsSelected = vi.fn();
        const { result } = renderHook(() => useMantenimientos([], [], [], true, setIsSelected, vi.fn(), mockRemoveFromRoute));

        act(() => {
            result.current.toggleRoute();
        });
        
        expect(mockRemoveFromRoute).toHaveBeenCalledTimes(1);
        expect(setIsSelected).toHaveBeenCalledWith(false);
    });

    it('Debería devolver los nombres correctos con las funciones auxiliares', () => {
        const { result } = renderHook(() => useMantenimientos(mockSucursales, mockCuadrillas, mockClientes));

        // Pruebo que las funciones `get...` devuelvan el valor correcto o el por defecto.
        expect(result.current.getSucursalNombre(101)).toBe('Sucursal A');
        expect(result.current.getSucursalNombre(999)).toBe('Desconocida');
        
        expect(result.current.getCuadrillaNombre(201)).toBe('Cuadrilla Alfa');
        expect(result.current.getCuadrillaNombre(999)).toBe('Desconocida');
        
        expect(result.current.getZonaNombre(101)).toBe('Norte');
        expect(result.current.getZonaNombre(999)).toBe('Desconocida');
        
        expect(result.current.getClienteNombre(1)).toBe('Cliente Demo');
        expect(result.current.getClienteNombre(999)).toBe('Sin cliente');
    });
<<<<<<< Updated upstream

    it('Debería formatear la fecha correctamente con formatExtendido', () => {
        const { result } = renderHook(() => useMantenimientos());
        const fechaISO = '2025-10-15T11:58:00Z'; // UTC
        // La función `formatExtendido` convierte la fecha a formato local.
        const fechaFormateada = result.current.formatExtendido(fechaISO);

        // Verifico que el formato sea el esperado (YYYY-MM-DD HH:mm).
        expect(fechaFormateada).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
        // Dado que la hora es 11:58 UTC, en Argentina (-3) debería ser 08:58.
        expect(fechaFormateada).toContain('2025-10-15 08:58');
    });
});
=======
});
>>>>>>> Stashed changes
