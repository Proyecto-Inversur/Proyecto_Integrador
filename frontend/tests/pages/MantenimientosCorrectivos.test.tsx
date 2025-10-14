import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página que voy a probar.
import useMantenimientoCorrectivo from '../../src/hooks/forms/useMantenimientoCorrectivo';
import MantenimientosCorrectivos from '../../src/pages/MantenimientosCorrectivos';

// --- Mocks ---
// Simulo las dependencias externas para aislar el test a esta página en particular.

// 1. Simulo el hook principal. Esto me da control total sobre los datos y el estado de la página.
vi.mock('../../src/hooks/forms/useMantenimientoCorrectivo');

// 2. Simulo los componentes hijos. No necesito probar su lógica interna aquí, solo que se rendericen
//    y reciban las props correctas.
vi.mock('../../src/components/DataTable', () => ({ 
    default: (props) => (
        // El mock de DataTable renderiza `filterContent` para que podamos probar los filtros.
        <div>
            <div data-testid="data-table" data-columns={JSON.stringify(props.columns)} />
            {props.filterContent}
        </div>
    )
}));
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/MantenimientoCorrectivoForm', () => ({ default: () => <div data-testid="correctivo-form" /> }));
vi.mock('../../src/components/BackButton', () => ({ default: () => <div data-testid="back-button" /> }));

// Suite de tests para la página de Mantenimientos Correctivos.
describe('Página MantenimientosCorrectivos', () => {

    // Defino un objeto con la salida por defecto de mi hook simulado.
    // Esto representa el estado "ideal" o más común de la página.
    const mockUseCorrectivoReturn = {
        filteredMantenimientos: [],
        sucursales: [{ id: 1, nombre: 'Sucursal Test' }],
        cuadrillas: [{ id: 1, nombre: 'Cuadrilla Test' }],
        zonas: [{ id: 1, nombre: 'Zona Test' }],
        showForm: false,
        setShowForm: vi.fn(),
        selectedMantenimiento: null,
        filters: { cuadrilla: '', sucursal: '', zona: '', rubro: '', estado: '', prioridad: '', sortByDate: 'desc' },
        isLoading: false,
        isUser: true, // Por defecto, pruebo la vista de administrador/usuario.
        handleFilterChange: vi.fn(),
        handleDelete: vi.fn(),
        handleEdit: vi.fn(),
        handleRowClick: vi.fn(),
        handleFormClose: vi.fn(),
        getSucursalNombre: (id) => `Sucursal ${id}`,
        getCuadrillaNombre: (id) => `Cuadrilla ${id}`,
        getZonaNombre: (id) => `Zona ${id}`,
    };

    // Antes de cada test, limpio todas las funciones "espía" (mocks).
    // Esto asegura que cada prueba sea independiente y no se vea afectada por la anterior.
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue(mockUseCorrectivoReturn);
    });

    // Función auxiliar para renderizar el componente. Envuelve la página en MemoryRouter
    // porque sus componentes hijos (como BackButton) dependen de react-router.
    const renderPage = (props) => {
        return render(
            <MemoryRouter>
                <MantenimientosCorrectivos {...props} />
            </MemoryRouter>
        );
    };

    // Test para el estado de carga.
    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        // Para este caso específico, sobrescribo el valor del hook simulado.
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isLoading: true });
        renderPage();
        // Verifico que el spinner se muestre.
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    // Test para el renderizado por defecto.
    it('Debería mostrar los controles de admin/usuario por defecto', () => {
        renderPage();
        // Verifico que los elementos principales de la UI estén visibles.
        expect(screen.getByRole('heading', { name: /Gestión de Mantenimientos Correctivos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
    });

    // Test para la lógica de roles.
    it('NO debería mostrar el botón "Agregar" para un no-usuario (ej. cuadrilla)', () => {
        // Simulo la vista para un usuario que no es administrador.
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isUser: false });
        renderPage();
        // `queryByRole` es útil aquí porque devuelve null si no encuentra el elemento, en lugar de fallar.
        expect(screen.queryByRole('button', { name: /Agregar/i })).toBeNull();
    });

    // Test para la interacción con el panel de filtros.
    it('Debería abrir y cerrar el panel de filtros al hacer clic en el botón', () => {
        renderPage();
        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        
        // Verifico el estado inicial (cerrado) a través del atributo `aria-expanded`.
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');

        // Simulo un clic para abrir el panel y verifico que el atributo cambie.
        fireEvent.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'true');
        
        // Simulo otro clic para cerrar y verifico que el atributo vuelva a ser false.
        fireEvent.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');
    });

    // Test para la visibilidad del formulario.
    it('Debería mostrar el formulario cuando showForm es true', () => {
        // Simulo el estado en el que el formulario debe ser visible.
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, showForm: true });
        renderPage();
        // Verifico que el componente del formulario se renderice.
        expect(screen.getByTestId('correctivo-form')).toBeInTheDocument();
    });

    // Test para verificar que las props se pasen correctamente a los hijos según el rol.
    it('Debería pasar las columnas correctas a DataTable según el rol del usuario', () => {
        // Simulo ser un usuario/admin.
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isUser: true });
        const { rerender } = renderPage();

        let dataTable = screen.getByTestId('data-table');
        let columnsProp = JSON.parse(dataTable.getAttribute('data-columns'));
        // El usuario admin debe ver la columna 'acciones'.
        expect(columnsProp.some(c => c.key === 'acciones')).toBe(true);

        // Simulo ser un no-usuario (cuadrilla).
        vi.mocked(useMantenimientoCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isUser: false });
        // Uso `rerender` para actualizar el componente con el nuevo estado del hook.
        rerender(
            <MemoryRouter>
                <MantenimientosCorrectivos />
            </MemoryRouter>
        );

        dataTable = screen.getByTestId('data-table');
        columnsProp = JSON.parse(dataTable.getAttribute('data-columns'));
        // La cuadrilla no debe ver la columna 'acciones'.
        expect(columnsProp.some(c => c.key === 'acciones')).toBe(false);
    });
});