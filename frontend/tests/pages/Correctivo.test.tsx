import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useCorrectivo from '../../src/hooks/mantenimientos/useCorrectivo';
import Correctivo from '../../src/pages/Correctivo';

// --- Mocks ---

vi.mock('../../src/hooks/mantenimientos/useCorrectivo');

vi.mock('../../src/components/mantenimientos/MantenimientoInfo', () => ({ 
    default: (props) => (
        <div 
            data-testid="mantenimiento-info" 
            data-show-finish-button={props.showFinishButton} 
        />
    )
}));

vi.mock('../../src/components/LoadingSpinner', () => ({ default: () => <div data-testid="loading-spinner" /> }));
vi.mock('../../src/components/BackButton', () => ({ default: () => <div data-testid="back-button" /> }));
vi.mock('../../src/components/mantenimientos/ChatSection', () => ({ default: () => <div data-testid="chat-section" /> }));
vi.mock('../../src/components/mantenimientos/PlanillaSection', () => ({ default: () => <div data-testid="planilla-section" /> }));
vi.mock('../../src/components/mantenimientos/PhotoSection', () => ({ default: () => <div data-testid="photo-section" /> }));

vi.mock('react-router-dom', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        useLocation: () => ({
            state: { mantenimientoId: '123' },
        }),
    };
});

// --- Setup del Test ---

describe('Página Correctivo', () => {
    
    const mockUseCorrectivoReturn = {
        isLoading: false,
        isMobile: false,
        isCuadrilla: true,
        mantenimiento: { id: '123', estado: 'Pendiente', fotos: [] },
        showModal: false,
        isChatOpen: false,
        setIsChatOpen: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCorrectivo).mockReturnValue(mockUseCorrectivoReturn);
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter>
                <Correctivo />
            </MemoryRouter>
        );
    };

    // --- Tests  ---
    it('Debería mostrar el spinner de carga cuando isLoading es true', () => {
        vi.mocked(useCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isLoading: true });
        renderWithRouter();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.queryByTestId('mantenimiento-info')).toBeNull();
    });

    it('Debería renderizar todos los componentes hijos en la vista de escritorio', () => {
        renderWithRouter();
        expect(screen.getByTestId('mantenimiento-info')).toBeInTheDocument();
        expect(document.querySelector('.main-row > .chat-section')).toBeInTheDocument();
        expect(screen.getByTestId('planilla-section')).toBeInTheDocument();
    });

    it('Debería mostrar el botón de chat flotante en la vista móvil', () => {
        vi.mocked(useCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isMobile: true });
        renderWithRouter();
        expect(document.querySelector('.main-row > .chat-section')).toBeNull();
        const floatingChatButton = document.querySelector('.floating-chat-btn');
        expect(floatingChatButton).toBeInTheDocument();
    });

    it('Debería llamar a setIsChatOpen al hacer clic en el botón de chat móvil', () => {
        vi.mocked(useCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isMobile: true, isChatOpen: false });
        renderWithRouter();
        const floatingChatButton = document.querySelector('.floating-chat-btn');
        fireEvent.click(floatingChatButton);
        expect(mockUseCorrectivoReturn.setIsChatOpen).toHaveBeenCalledWith(true);
    });


    it('Debería pasar showFinishButton=true a MantenimientoInfo si es cuadrilla y el estado no está finalizado', () => {
        // El mock por defecto ya cumple esta condición (isCuadrilla: true, estado: 'Pendiente')
        renderWithRouter();
        const mantenimientoInfo = screen.getByTestId('mantenimiento-info');
        // Verificamos el atributo data que creamos en el mock
        expect(mantenimientoInfo).toHaveAttribute('data-show-finish-button', 'true');
    });

    it('Debería pasar showFinishButton=false si el mantenimiento ya está Finalizado', () => {
        // Sobrescribimos el mock para este caso
        vi.mocked(useCorrectivo).mockReturnValue({
            ...mockUseCorrectivoReturn,
            mantenimiento: { ...mockUseCorrectivoReturn.mantenimiento, estado: 'Finalizado' },
        });

        renderWithRouter();
        const mantenimientoInfo = screen.getByTestId('mantenimiento-info');
        // Verificamos que el valor ahora es 'false'
        expect(mantenimientoInfo).toHaveAttribute('data-show-finish-button', 'false');
    });

    it('Debería mostrar el modal de imagen cuando showModal es true', () => {
        // Sobrescribimos el mock para que el modal deba mostrarse
        vi.mocked(useCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, showModal: true });
        
        renderWithRouter();

        // Buscamos el contenido del modal para verificar que se está mostrando.
        expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    });

    it('Debería aplicar la clase "open" al overlay del chat móvil cuando isChatOpen es true', () => {
        vi.mocked(useCorrectivo).mockReturnValue({ ...mockUseCorrectivoReturn, isMobile: true, isChatOpen: true });

        renderWithRouter();

        const chatOverlay = document.querySelector('.chat-overlay');
        expect(chatOverlay).toHaveClass('open');
    });
});