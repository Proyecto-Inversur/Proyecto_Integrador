import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página que voy a probar.
import useUsers from '../../src/hooks/forms/useUsers';
import Users from '../../src/pages/Users';

// --- Mocks ---
// Simulo las dependencias externas para aislar la prueba a la lógica de la página.

// 1. Simulo el hook principal para tener control total sobre el estado.
vi.mock('../../src/hooks/forms/useUsers');

// 2. Simulo los componentes hijos para verificar que se rendericen.
vi.mock('../../src/components/DataTable', () => ({ default: (props) => <div data-testid="data-table" /> }));
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/forms/UserForm', () => ({ default: (props) => <div data-testid="user-form" /> }));


describe('Página de Gestión de Usuarios', () => {

    // Defino la salida por defecto de mi hook simulado.
    const mockUseUsersReturn = {
        users: [{ id: 1, nombre: 'Usuario de Prueba', email: 'test@test.com', rol: 'Admin' }],
        showForm: false,
        setShowForm: vi.fn(),
        selectedUser: null,
        error: null,
        isLoading: false,
        handleDelete: vi.fn(),
        handleEdit: vi.fn(),
        handleFormClose: vi.fn(),
    };

    // Antes de cada test, limpio los mocks para que las pruebas no se afecten entre sí.
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUsers).mockReturnValue(mockUseUsersReturn);
    });

    // Función auxiliar para renderizar el componente.
    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );
    };

    // Test para el estado de carga.
    it('Debería mostrar el spinner de carga mientras los datos se están obteniendo', () => {
        // Para este caso, sobrescribo el valor del hook para simular que está cargando.
        vi.mocked(useUsers).mockReturnValue({ ...mockUseUsersReturn, isLoading: true });
        renderPage();

        // Verifico que el spinner se muestre.
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        // El resto de la UI no debería estar visible.
        expect(screen.queryByRole('heading', { name: /Gestión de Usuarios/i })).toBeNull();
    });

    // Test para el renderizado por defecto.
    it('Debería mostrar la tabla y los controles principales cuando la carga finaliza', () => {
        renderPage();

        // Verifico que los elementos principales de la UI estén visibles.
        expect(screen.getByRole('heading', { name: /Gestión de Usuarios/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
        
        // Por defecto, el formulario y las alertas de error deben estar ocultos.
        expect(screen.queryByTestId('user-form')).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    // Test para el manejo de errores.
    it('Debería mostrar un mensaje de error si el hook devuelve un error', () => {
        const errorMsg = 'No se pudieron cargar los usuarios.';
        // Simulo un estado de error.
        vi.mocked(useUsers).mockReturnValue({ ...mockUseUsersReturn, error: errorMsg });
        renderPage();

        // Verifico que la alerta se muestre con el mensaje correcto.
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(errorMsg);
    });

    // Test para la interacción de abrir el formulario.
    it('Debería llamar a la función para mostrar el formulario al hacer clic en "Agregar"', () => {
        renderPage();
        const addButton = screen.getByRole('button', { name: /Agregar/i });
        fireEvent.click(addButton);

        // Verifico que se intentó cambiar el estado para mostrar el formulario.
        expect(mockUseUsersReturn.setShowForm).toHaveBeenCalledWith(true);
    });

    // Test para la visibilidad del formulario.
    it('Debería renderizar el UserForm cuando showForm es true', () => {
        // Simulo el estado en el que el formulario debe ser visible.
        vi.mocked(useUsers).mockReturnValue({ ...mockUseUsersReturn, showForm: true });
        renderPage();

        // Verifico que el componente del formulario se renderice.
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
});