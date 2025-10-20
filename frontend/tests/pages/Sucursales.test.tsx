import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página que voy a probar.
import useSucursales from '../../src/hooks/forms/useSucursales';
import Sucursales from '../../src/pages/Sucursales';

// --- Mocks ---
// Simulo las dependencias para aislar la prueba a la lógica de la página.

// 1. Simulo el hook principal para controlar el estado.
vi.mock('../../src/hooks/forms/useSucursales');

// 2. Simulo los componentes hijos para verificar que se rendericen.
vi.mock('../../src/components/DataTable', () => ({ default: (props) => <div data-testid="data-table" /> }));
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/SucursalForm', () => ({ default: (props) => <div data-testid="sucursal-form" /> }));


describe('Página Sucursales', () => {

    // Defino la salida por defecto de mi hook simulado.
    const mockUseSucursalesReturn = {
        sucursales: [{ id: 1, nombre: 'Sucursal de Prueba' }],
        showForm: false,
        setShowForm: vi.fn(),
        selectedSucursal: null,
        isLoading: false,
        handleDelete: vi.fn(),
        handleEdit: vi.fn(),
        handleFormClose: vi.fn(),
    };

    beforeEach(() => {
        // Antes de cada test, limpio los mocks.
        vi.clearAllMocks();
        vi.mocked(useSucursales).mockReturnValue(mockUseSucursalesReturn);
    });

    // Función auxiliar para renderizar el componente.
    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Sucursales />
            </MemoryRouter>
        );
    };

    // Test para el estado de carga.
    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        // Sobrescribo el estado de carga para este test.
        vi.mocked(useSucursales).mockReturnValue({ ...mockUseSucursalesReturn, isLoading: true });

        renderPage();

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        // El resto de la UI no debería estar visible.
        expect(screen.queryByRole('heading', { name: /Gestión de Sucursales/i })).toBeNull();
    });

    // Test para el renderizado por defecto.
    it('Debería mostrar la tabla y los controles cuando la carga ha finalizado', () => {
        renderPage();

        // Verifico que los elementos principales de la UI estén visibles.
        expect(screen.getByRole('heading', { name: /Gestión de Sucursales/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
        
        // Por defecto, el formulario debe estar oculto.
        expect(screen.queryByTestId('sucursal-form')).toBeNull();
    });

    // Test para la interacción de abrir el formulario.
    it('Debería llamar a setShowForm al hacer clic en el botón "Agregar"', () => {
        renderPage();

        const addButton = screen.getByRole('button', { name: /Agregar/i });
        fireEvent.click(addButton);

        // Verifico que se intentó cambiar el estado para mostrar el formulario.
        expect(mockUseSucursalesReturn.setShowForm).toHaveBeenCalledWith(true);
    });

    // Test para la visibilidad del formulario.
    it('Debería mostrar el SucursalForm cuando showForm es true', () => {
        // Simulo el estado en el que el formulario debe ser visible.
        vi.mocked(useSucursales).mockReturnValue({ ...mockUseSucursalesReturn, showForm: true });

        renderPage();

        // El formulario ahora debería estar visible.
        expect(screen.getByTestId('sucursal-form')).toBeInTheDocument();
    });
});