import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página para poder simularlos.
import usePreventivo from '../../src/hooks/mantenimientos/usePreventivo';
import Preventivo from '../../src/pages/Preventivo';

// --- Mocks ---
// Simulo todas las dependencias externas para aislar el test.

// 1. Simulo el hook principal para tener control total sobre el estado de la página.
vi.mock('../../src/hooks/mantenimientos/usePreventivo');

// 2. Simulo los componentes hijos para verificar que se rendericen y reciban las props correctas.
vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/BackButton', () => ({ default: () => <div data-testid="back-button" /> }));
// Hago los mocks de MantenimientoInfo y PlanillaSection un poco más inteligentes para poder leer sus props.
vi.mock('../../src/components/mantenimientos/MantenimientoInfo', () => ({ 
    default: (props) => <div data-testid="mantenimiento-info" data-show-finish-button={props.showFinishButton} /> 
}));
vi.mock('../../src/components/mantenimientos/PlanillaSection', () => ({ 
    default: (props) => <div data-testid="planilla-section" data-multiple={props.multiple} /> 
}));
vi.mock('../../src/components/mantenimientos/ChatSection', () => ({ default: () => <div data-testid="chat-section" /> }));
vi.mock('../../src/components/mantenimientos/PhotoSection', () => ({ default: () => <div data-testid="photo-section" /> }));

// 3. Simulo `useLocation` para que la página pueda obtener el ID del mantenimiento.
vi.mock('react-router-dom', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        useLocation: () => ({
            state: { mantenimientoId: 'p123' },
        }),
    };
});


describe('Página Preventivo', () => {

    // Defino la salida por defecto de mi hook simulado.
    const mockUsePreventivoReturn = {
        mantenimiento: { id: 'p123', fecha_cierre: null, fotos: [] },
        isLoading: false,
        isMobile: false,
        isUser: true,
        showModal: false,
        isChatOpen: false,
        setIsChatOpen: vi.fn(),
        // Agrego las demás funciones como mocks vacíos.
        handleFinish: vi.fn(),
        handleSubmit: vi.fn(),
    };

    beforeEach(() => {
        // Antes de cada test, limpio los mocks y reseteo el hook a su estado por defecto.
        vi.clearAllMocks();
        vi.mocked(usePreventivo).mockReturnValue(mockUsePreventivoReturn);
    });

    // Función auxiliar para renderizar el componente.
    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Preventivo />
            </MemoryRouter>
        );
    };

    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        vi.mocked(usePreventivo).mockReturnValue({ ...mockUsePreventivoReturn, isLoading: true });
        renderPage();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.queryByTestId('mantenimiento-info')).toBeNull();
    });

    it('Debería renderizar todos los componentes hijos en la vista de escritorio', () => {
        renderPage();
        expect(screen.getByTestId('mantenimiento-info')).toBeInTheDocument();
        expect(document.querySelector('.main-row > .chat-section')).toBeInTheDocument();
        expect(screen.getByTestId('planilla-section')).toBeInTheDocument();
        expect(screen.getByTestId('photo-section')).toBeInTheDocument();
    });

    it('Debería pasar showFinishButton=true a MantenimientoInfo si la fecha de cierre es nula', () => {
        // El mock por defecto ya tiene fecha_cierre: null
        renderPage();
        const mantenimientoInfo = screen.getByTestId('mantenimiento-info');
        expect(mantenimientoInfo).toHaveAttribute('data-show-finish-button', 'true');
    });

    it('Debería pasar showFinishButton=false si el mantenimiento ya tiene fecha de cierre', () => {
        vi.mocked(usePreventivo).mockReturnValue({
            ...mockUsePreventivoReturn,
            mantenimiento: { ...mockUsePreventivoReturn.mantenimiento, fecha_cierre: '2025-10-14' },
        });
        renderPage();
        const mantenimientoInfo = screen.getByTestId('mantenimiento-info');
        expect(mantenimientoInfo).toHaveAttribute('data-show-finish-button', 'false');
    });

    it('Debería pasar siempre la prop "multiple" a PlanillaSection', () => {
        renderPage();
        const planillaSection = screen.getByTestId('planilla-section');
        expect(planillaSection).toHaveAttribute('data-multiple', 'true');
    });

    it('Debería mostrar el modal de imagen cuando showModal es true', () => {
        vi.mocked(usePreventivo).mockReturnValue({ ...mockUsePreventivoReturn, showModal: true });
        renderPage();
        // Buscamos un elemento dentro del modal para confirmar que está abierto.
        expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    });
});