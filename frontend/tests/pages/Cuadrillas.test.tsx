import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importamos el hook y la página para poder mockear el primero y renderizar la segunda.
import useCuadrillas from '../../src/hooks/forms/useCuadrillas';
import Cuadrillas from '../../src/pages/Cuadrillas';

// --- Mocks ---

// 1. Mockeamos el hook principal para tener control total sobre el estado de la página.
vi.mock('../../src/hooks/forms/useCuadrillas');

// 2. Mockeamos los componentes hijos para aislar la prueba a la lógica de la página.
vi.mock('../../src/components/DataTable', () => ({ default: (props) => <div data-testid="data-table" {...props} /> }));
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/CuadrillaForm', () => ({ default: (props) => <div data-testid="cuadrilla-form" {...props} /> }));

describe('Página Cuadrillas', () => {

    // Definimos la salida por defecto de nuestro hook simulado.
    const mockUseCuadrillasReturn = {
        cuadrillas: [{ id: 1, nombre: 'Cuadrilla Test' }],
        showForm: false,
        setShowForm: vi.fn(),
        selectedCuadrilla: null,
        error: null,
        isLoading: false,
        handleDelete: vi.fn(),
        handleEdit: vi.fn(),
        handleFormClose: vi.fn(),
    };

    beforeEach(() => {
        // Antes de cada test, limpiamos los mocks y reseteamos el hook a su estado por defecto.
        vi.clearAllMocks();
        vi.mocked(useCuadrillas).mockReturnValue(mockUseCuadrillasReturn);
    });

    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        // Sobrescribimos el estado de carga para este test.
        vi.mocked(useCuadrillas).mockReturnValue({ ...mockUseCuadrillasReturn, isLoading: true });

        render(<Cuadrillas />);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        // El resto de la UI no debería estar visible.
        expect(screen.queryByRole('heading', { name: /Gestión de Cuadrillas/i })).toBeNull();
    });

    it('Debería mostrar la tabla y los controles cuando la carga ha finalizado', () => {
        render(<Cuadrillas />);

        expect(screen.getByRole('heading', { name: /Gestión de Cuadrillas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
        // Por defecto, el formulario y el error no deben mostrarse.
        expect(screen.queryByTestId('cuadrilla-form')).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('Debería mostrar un mensaje de error si el hook devuelve un error', () => {
        const errorMsg = 'Error al cargar los datos';
        vi.mocked(useCuadrillas).mockReturnValue({ ...mockUseCuadrillasReturn, error: errorMsg });

        render(<Cuadrillas />);
        
        // Verificamos que se muestre una alerta con el mensaje de error.
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(errorMsg);
    });

    it('Debería llamar a setShowForm al hacer clic en el botón "Agregar"', () => {
        render(<Cuadrillas />);

        const addButton = screen.getByRole('button', { name: /Agregar/i });
        fireEvent.click(addButton);

        // Verificamos que se intentó cambiar el estado para mostrar el formulario.
        expect(mockUseCuadrillasReturn.setShowForm).toHaveBeenCalledWith(true);
    });

    it('Debería mostrar el CuadrillaForm cuando showForm es true', () => {
        vi.mocked(useCuadrillas).mockReturnValue({ ...mockUseCuadrillasReturn, showForm: true });

        render(<Cuadrillas />);

        // El formulario ahora debería estar visible.
        expect(screen.getByTestId('cuadrilla-form')).toBeInTheDocument();
    });

    it('Debería pasar las props correctas a DataTable y CuadrillaForm', () => {
        const selectedCuadrillaMock = { id: 2, nombre: 'Cuadrilla a Editar' };
        vi.mocked(useCuadrillas).mockReturnValue({
            ...mockUseCuadrillasReturn,
            showForm: true, // Mostramos el form para probarlo también
            selectedCuadrilla: selectedCuadrillaMock,
        });

        render(<Cuadrillas />);

        // Verificamos las props pasadas a DataTable
        const dataTable = screen.getByTestId('data-table');
        expect(dataTable.getAttribute('data')).toBe(mockUseCuadrillasReturn.cuadrillas.toString());
        
        // Verificamos las props pasadas a CuadrillaForm
        const cuadrillaForm = screen.getByTestId('cuadrilla-form');
        expect(cuadrillaForm.getAttribute('cuadrilla')).toBe(selectedCuadrillaMock.toString());
    });
});