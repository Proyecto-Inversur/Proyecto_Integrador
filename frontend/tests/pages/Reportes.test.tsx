import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo el hook y la página para poder simularlos.
import useReportes from '../../src/hooks/useReportes';
import Reportes from '../../src/pages/Reportes';

// --- Mocks ---
// Simulo todas las dependencias externas para aislar el test.

// 1. Simulo el hook principal para tener control total sobre el estado.
vi.mock('../../src/hooks/useReportes');

// 2. Simulo los componentes de la librería de gráficos. No necesito probar que dibujen un gráfico,
//    solo que mi página intente renderizarlos con los datos correctos.
vi.mock('react-chartjs-2', () => ({
    Pie: (props) => <div data-testid="pie-chart" />,
    Bar: (props) => <div data-testid="bar-chart" />,
}));


describe('Página de Reportes', () => {

    // Defino la salida por defecto del hook simulado (estado inicial sin datos).
    const mockUseReportesReturn = {
        month: '',
        months: [{ value: '10', label: 'Octubre' }],
        setMonth: vi.fn(),
        year: '2025',
        years: ['2025'],
        setYear: vi.fn(),
        reportData: {}, // Por defecto, no hay datos de reporte.
        handleGenerateReports: vi.fn(),
        generatePieChartData: vi.fn(() => [{ title: 'Gráfico Pie Test', data: {} }]), // Hacemos que devuelva algo para que el map no falle
        generateBarChartData: vi.fn(() => ({})),
        handleDownloadReport: vi.fn(),
    };

    beforeEach(() => {
        // Antes de cada test, limpio los mocks.
        vi.clearAllMocks();
        vi.mocked(useReportes).mockReturnValue(mockUseReportesReturn);
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Reportes />
            </MemoryRouter>
        );
    };

    it('Debería renderizar la UI inicial sin datos de reporte', () => {
        renderPage();

        // Verifico que los controles estén presentes.
        expect(screen.getByRole('heading', { name: /Reportes/i })).toBeInTheDocument();
        expect(screen.getByLabelText('Mes:')).toBeInTheDocument();
        expect(screen.getByLabelText('Año:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generar Reportes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Descargar Reporte/i })).toBeInTheDocument();

        // Verifico que las secciones de reportes NO estén visibles.
        expect(screen.queryByRole('heading', { name: /Preventivos por Cuadrilla/i })).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();
    });

    it('Debería llamar a las funciones de control al interactuar con los filtros y botones', () => {
        renderPage();

        // Simulo un cambio en el selector de mes.
        const monthSelect = screen.getByLabelText('Mes:');
        fireEvent.change(monthSelect, { target: { value: '10' } });
        expect(mockUseReportesReturn.setMonth).toHaveBeenCalledWith('10');

        // Simulo un clic en el botón de generar.
        const generateButton = screen.getByRole('button', { name: /Generar Reportes/i });
        fireEvent.click(generateButton);
        expect(mockUseReportesReturn.handleGenerateReports).toHaveBeenCalledTimes(1);

        // Simulo un clic en el botón de descargar.
        const downloadButton = screen.getByRole('button', { name: /Descargar Reporte/i });
        fireEvent.click(downloadButton);
        expect(mockUseReportesReturn.handleDownloadReport).toHaveBeenCalledTimes(1);
    });

    it('Debería mostrar las secciones de reportes cuando hay datos', () => {
        // Defino datos de prueba para los reportes.
        const mockReportDataWithData = {
            preventivos: [{ nombre: 'Cuadrilla Alfa', ratio: '5/10' }],
            correctivos: [{ nombre: 'Cuadrilla Beta', ratio: '8/12' }],
            rubros: { rubros: [{ rubro: 'Electricidad', avgDays: 5, count: 2 }], totalAvgDays: 5, totalCount: 2 },
            zonas: [{ zona: 'Norte', totalCorrectivos: 10, avgCorrectivos: 2.5 }],
            sucursales: [{ sucursal: 'Centro', zona: 'Norte', totalCorrectivos: 4 }],
        };

        // Sobrescribo el mock del hook para que devuelva los datos.
        vi.mocked(useReportes).mockReturnValue({
            ...mockUseReportesReturn,
            reportData: mockReportDataWithData,
        });

        renderPage();

        // Verifico que los títulos de cada sección ahora sí estén visibles.
        expect(screen.getByRole('heading', { name: /Preventivos por Cuadrilla/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Correctivos por Cuadrilla/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Días Promedio Correctivos por Rubro/i })).toBeInTheDocument();

        // Verifico que se rendericen los gráficos simulados.
        expect(screen.getAllByTestId('pie-chart')).toHaveLength(2); // Uno para preventivos, uno para correctivos.
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(2); // Uno para zonas, uno para sucursales.

        // Verifico que los datos aparezcan en una de las tablas.
        expect(screen.getByText('Cuadrilla Alfa')).toBeInTheDocument();
        expect(screen.getByText('5/10')).toBeInTheDocument();
        expect(screen.getByText('Electricidad')).toBeInTheDocument();
        expect(screen.getByText('Total General')).toBeInTheDocument();
    });
});