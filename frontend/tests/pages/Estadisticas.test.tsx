import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useEstadisticas from '../../src/hooks/useEstadisticas';
import Estadisticas from '../../src/pages/Estadisticas';

vi.mock('../../src/hooks/useEstadisticas');

vi.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="pie-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
}));

describe('Página de Estadísticas', () => {
  const mockUseEstadisticasReturn = {
    selectedMonths: [],
    months: [{ value: '10', label: 'Octubre' }],
    setSelectedMonths: vi.fn(),
    selectedYears: [],
    years: ['2025'],
    setSelectedYears: vi.fn(),
    clientes: [{ id: '1', nombre: 'Cliente Uno' }],
    zonas: [{ id: '1', nombre: 'Norte' }],
    sucursales: [{ id: '1', nombre: 'Sucursal Centro', cliente_id: '1', zona: 'Norte' }],
    cuadrillas: [{ id: '1', nombre: 'Cuadrilla Alfa' }],
    isLoadingData: false,
    estadisticasData: {},
    handleGenerateEstadisticas: vi.fn(),
    generatePieChartData: vi.fn(() => [{ title: 'Gráfico Pie Test', labels: [], datasets: [] }]),
    generateBarChartData: vi.fn(() => ({})),
    handleDownloadEstadisticas: vi.fn(),
  };

  const defaultFilterPayload = {
    preventivos: { cliente: '', zona: '', sucursal: '', cuadrilla: '' },
    correctivos: { cliente: '', zona: '', sucursal: '', cuadrilla: '' },
    rubros: { cliente: '', zona: '', sucursal: '', cuadrilla: '' },
    zonas: { cliente: '', cuadrilla: '' },
    sucursales: { cliente: '', zona: '', cuadrilla: '' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEstadisticas).mockReturnValue(mockUseEstadisticasReturn);
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <Estadisticas />
      </MemoryRouter>
    );

  it('renderiza la UI inicial de estadísticas sin datos', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockUseEstadisticasReturn.handleGenerateEstadisticas).toHaveBeenCalledWith(defaultFilterPayload);
    });

    expect(screen.getByRole('heading', { name: /Estadísticas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meses/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Años/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Descargar Estadísticas/i })).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: /Preventivos por Cuadrilla/i })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('actualiza automáticamente las estadísticas al modificar los filtros', async () => {
    vi.mocked(useEstadisticas).mockReturnValue({
      ...mockUseEstadisticasReturn,
      estadisticasData: {
        preventivos: [],
        correctivos: [],
        rubros: { rubros: [], totalAvgDays: 0, totalCount: 0 },
        zonas: [],
        sucursales: [],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(mockUseEstadisticasReturn.handleGenerateEstadisticas).toHaveBeenCalledWith(defaultFilterPayload);
    });

    const monthDropdown = screen.getByRole('button', { name: /Meses/ });
    fireEvent.click(monthDropdown);
    fireEvent.click(screen.getByLabelText('Octubre'));
    expect(mockUseEstadisticasReturn.setSelectedMonths).toHaveBeenCalledWith(['10']);

    const preventivosSection = screen.getByRole('heading', { name: /Preventivos por Cuadrilla/i }).closest('section') as HTMLElement;
    const clienteSelect = within(preventivosSection).getByLabelText('Cliente');
    fireEvent.change(clienteSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(mockUseEstadisticasReturn.handleGenerateEstadisticas).toHaveBeenLastCalledWith({
        ...defaultFilterPayload,
        preventivos: { cliente: '1', zona: '', sucursal: '', cuadrilla: '' },
      });
    });
    expect(mockUseEstadisticasReturn.handleGenerateEstadisticas).toHaveBeenCalledTimes(2);

    const downloadButton = screen.getByRole('button', { name: /Descargar Estadísticas/i });
    fireEvent.click(downloadButton);
    expect(mockUseEstadisticasReturn.handleDownloadEstadisticas).toHaveBeenCalledTimes(1);
  });

  it('muestra las secciones de estadísticas cuando hay datos', () => {
    const mockEstadisticasDataWithData = {
      preventivos: [{ nombre: 'Cuadrilla Alfa', ratio: '5/10' }],
      correctivos: [{ nombre: 'Cuadrilla Beta', ratio: '8/12' }],
      rubros: { rubros: [{ rubro: 'Electricidad', avgDays: 5, count: 2 }], totalAvgDays: 5, totalCount: 2 },
      zonas: [{ zona: 'Norte', totalCorrectivos: 10, avgCorrectivos: 2.5 }],
      sucursales: [{ sucursal: 'Centro', zona: 'Norte', totalCorrectivos: 4 }],
    };

    vi.mocked(useEstadisticas).mockReturnValue({
      ...mockUseEstadisticasReturn,
      estadisticasData: mockEstadisticasDataWithData,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: /Preventivos por Cuadrilla/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Correctivos por Cuadrilla/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Días Promedio Correctivos por Rubro/i })).toBeInTheDocument();

    expect(screen.getAllByTestId('pie-chart')).toHaveLength(2);
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);

    expect(screen.getAllByText('Cuadrilla Alfa')[0]).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getAllByText('Electricidad')[0]).toBeInTheDocument();
    expect(screen.getByText('Total General')).toBeInTheDocument();
  });
});
