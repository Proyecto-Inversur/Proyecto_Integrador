// frontend/tests/pages/MantenimientosPreventivos.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página que voy a probar.
import useMantenimientoPreventivo from '../../src/hooks/forms/useMantenimientoPreventivo';
import MantenimientosPreventivos from '../../src/pages/MantenimientosPreventivos';

// --- Mocks ---
// Simulo las dependencias externas para aislar el test.

// 1. Simulo el hook principal para tener control total sobre el estado.
vi.mock('../../src/hooks/forms/useMantenimientoPreventivo');

// 2. Simulo los componentes hijos. El mock de DataTable es clave para probar los filtros.
vi.mock('../../src/components/DataTable', () => ({ 
    default: (props) => (
        <div>
            <div data-testid="data-table" data-columns={JSON.stringify(props.columns)} />
            {props.filterContent}
        </div>
    )
}));
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/MantenimientoPreventivoForm', () => ({ default: () => <div data-testid="preventivo-form" /> }));
vi.mock('../../src/components/BackButton', () => ({ default: () => <div data-testid="back-button" /> }));

// Suite de tests para la página de Mantenimientos Preventivos.
describe('Página MantenimientosPreventivos', () => {

    // Defino la salida por defecto del hook simulado para un usuario/admin.
    const mockUsePreventivoReturn = {
        filteredMantenimientos: [],
        sucursales: [{ id: 1, nombre: 'Sucursal Test' }],
        cuadrillas: [{ id: 1, nombre: 'Cuadrilla Test' }],
        zonas: [{ id: 1, nombre: 'Zona Test' }],
        showForm: false,
        setShowForm: vi.fn(),
        selectedMantenimiento: null,
        filters: { cuadrilla: '', sucursal: '', zona: '', sortByDate: 'desc' },
        isLoading: false,
        isUser: true, // Por defecto, pruebo como usuario/admin.
        handleFilterChange: vi.fn(),
        handleDelete: vi.fn(),
        handleEdit: vi.fn(),
        handleRowClick: vi.fn(),
        handleFormClose: vi.fn(),
        getSucursalNombre: (id) => `Sucursal ${id}`,
        getCuadrillaNombre: (id) => `Cuadrilla ${id}`,
        getZonaNombre: (id) => `Zona ${id}`,
    };

    beforeEach(() => {
        // Antes de cada test, limpio los mocks.
        vi.clearAllMocks();
        vi.mocked(useMantenimientoPreventivo).mockReturnValue(mockUsePreventivoReturn);
    });

    // Función auxiliar para renderizar el componente con el contexto de Router.
    const renderPage = () => {
        return render(
            <MemoryRouter>
                <MantenimientosPreventivos />
            </MemoryRouter>
        );
    };

    // Test para el estado de carga.
    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        vi.mocked(useMantenimientoPreventivo).mockReturnValue({ ...mockUsePreventivoReturn, isLoading: true });
        renderPage();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    // Test para el renderizado por defecto como admin.
    it('Debería mostrar los controles de admin/usuario por defecto', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: /Gestión de Mantenimientos Preventivos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
    });

    // Test para la lógica de roles (vista de no-usuario).
    it('NO debería mostrar el botón "Agregar" ni ciertos filtros para un no-usuario', () => {
        vi.mocked(useMantenimientoPreventivo).mockReturnValue({ ...mockUsePreventivoReturn, isUser: false });
        renderPage();

        // El botón no debe existir.
        expect(screen.queryByRole('button', { name: /Agregar/i })).toBeNull();

        // Abrimos los filtros para verificar su contenido.
        fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
        
        // Los filtros de Cuadrilla y Zona no deberían estar para este rol.
        expect(screen.queryByLabelText('Cuadrilla')).toBeNull();
        expect(screen.queryByLabelText('Zona')).toBeNull();
        // Pero el de Sucursal sí.
        expect(screen.getByLabelText('Sucursal')).toBeInTheDocument();
    });

    // Test para la interacción con el panel de filtros.
    it('Debería abrir y cerrar el panel de filtros al hacer clic en el botón', () => {
        renderPage();
        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        
        // Verificamos el estado inicial (cerrado) a través del atributo `aria-expanded`.
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');

        // Simulamos un clic para abrir y verificamos el cambio.
        fireEvent.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'true');
        
        // Simulamos otro clic para cerrar.
        fireEvent.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');
    });

    // Test para la visibilidad del formulario.
    it('Debería mostrar el formulario cuando showForm es true', () => {
        vi.mocked(useMantenimientoPreventivo).mockReturnValue({ ...mockUsePreventivoReturn, showForm: true });
        renderPage();
        expect(screen.getByTestId('preventivo-form')).toBeInTheDocument();
    });
});