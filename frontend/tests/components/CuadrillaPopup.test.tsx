import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CuadrillaPopup from '../../src/components/maps/CuadrillaPopup';

const mockCuadrillaCompleta = {
  name: 'Alfa',
  sucursales: [
    { name: 'Sucursal Central' },
    { name: 'Sucursal Norte' },
  ],
  correctivos: [
    {
      id: 101,
      nombre_sucursal: 'Sucursal Central',
      fecha_apertura: '2025-10-08',
      numero_caso: 'C-556',
      estado: 'En Progreso',
    },
  ],
  preventivos: [
    {
      id: 202,
      nombre_sucursal: 'Sucursal Norte',
      fecha_apertura: '2025-10-09',
      frecuencia: 'Mensual',
    },
    {
      id: 203,
      nombre_sucursal: 'Sucursal Oeste',
      fecha_apertura: null,
      frecuencia: 'Semanal',
    },
  ],
};

const mockCuadrillaVacia = {
  name: 'Beta',
  sucursales: [],
  correctivos: [],
  preventivos: [],
};

describe('CuadrillaPopup', () => {
  it('renderiza toda la informaci�n cuando los datos est�n completos', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaCompleta} />);

    const header = screen.getByText('Alfa').closest('.inv-header');
    expect(header).toBeInTheDocument();
    expect(within(header!).getByText('Cuadrilla')).toBeInTheDocument();

    const sucursalesSection = screen.getByText('Sucursales').closest('.inv-section')!;
    expect(within(sucursalesSection).getByText('Sucursal Central')).toBeInTheDocument();
    expect(within(sucursalesSection).getByText('Sucursal Norte')).toBeInTheDocument();

    const mantenimientosSection = screen.getByText('Mantenimientos').closest('.inv-section')!;
    expect(within(mantenimientosSection).getByText('C-556')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('En Progreso')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('Mensual')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('Semanal')).toBeInTheDocument();
  });

  it('muestra "Sin datos" cuando los arrays est�n vac�os', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaVacia} />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos')).toHaveLength(3);
  });

  it('muestra un guion cuando un valor est� ausente', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaCompleta} />);

    const preventivoBox = screen.getByText('203').closest('.inv-box')!;
    const fechaLabel = within(preventivoBox).getByText('Fecha');
    const fechaValue = fechaLabel.nextElementSibling;
    expect(fechaValue?.textContent?.trim()).toMatch(/^[-—]$/);
  });
});
