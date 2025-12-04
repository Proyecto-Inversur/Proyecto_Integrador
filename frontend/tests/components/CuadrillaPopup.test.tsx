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
      cliente_nombre: 'Cliente A',
      nombre_sucursal: 'Sucursal Central',
      fecha_apertura: '2025-10-08',
      numero_caso: 'C-556',
      estado: 'En Progreso',
    },
  ],
  preventivos: [
    {
      id: 202,
      cliente_nombre: 'Cliente B',
      nombre_sucursal: 'Sucursal Norte',
      fecha_apertura: '2025-10-09',
      frecuencia: 'Mensual',
    },
    {
      id: 203,
      cliente_nombre: 'Cliente C',
      nombre_sucursal: 'Sucursal Oeste',
      fecha_apertura: '2025-10-10',
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

const mockCuadrillaConFaltantes = {
  name: 'Gamma',
  sucursales: [{ name: 'Sucursal Sur' }],
  correctivos: [
    {
      id: 301,
      cliente_nombre: undefined,
      nombre_sucursal: 'Sucursal Sur',
      fecha_apertura: '2025-10-12',
      numero_caso: 'C-999',
      estado: 'Pendiente',
    },
  ],
  preventivos: [
    {
      id: 401,
      cliente_nombre: '',
      nombre_sucursal: 'Sucursal Sur',
      fecha_apertura: null,
      frecuencia: 'Trimestral',
    },
  ],
};

describe('CuadrillaPopup', () => {
  it('renderiza la informacion completa de la cuadrilla', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaCompleta} />);

    const header = screen.getByText('Alfa').closest('.inv-header');
    expect(header).toBeInTheDocument();
    expect(within(header!).getByText('Cuadrilla')).toBeInTheDocument();

    const sucursalesSection = screen.getByText('Sucursales').closest('.inv-section')!;
    expect(within(sucursalesSection).getByText('Sucursal Central')).toBeInTheDocument();
    expect(within(sucursalesSection).getByText('Sucursal Norte')).toBeInTheDocument();

    const mantenimientosSection = screen.getByText('Mantenimientos').closest('.inv-section')!;
    const correctivoBox = within(mantenimientosSection).getByText('C-556').closest('.inv-box')!;
    expect(within(correctivoBox).getByText('Cliente A')).toBeInTheDocument();
    expect(within(correctivoBox).getByText('Sucursal Central')).toBeInTheDocument();
    expect(within(correctivoBox).getByText('2025-10-08')).toBeInTheDocument();
    expect(within(correctivoBox).getByText('En Progreso')).toBeInTheDocument();

    const preventivoBox = within(mantenimientosSection).getByText('Mensual').closest('.inv-box')!;
    expect(within(preventivoBox).getByText('Cliente B')).toBeInTheDocument();
    expect(within(preventivoBox).getByText('Sucursal Norte')).toBeInTheDocument();
    expect(within(preventivoBox).getByText('2025-10-09')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('Semanal')).toBeInTheDocument();
  });

  it('muestra "Sin datos" cuando los arrays estan vacios', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaVacia} />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos')).toHaveLength(3);
  });

  it('usa valores por defecto para cliente y fecha faltantes', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaConFaltantes} />);

    const correctivoBox = screen.getByText('C-999').closest('.inv-box')!;
    expect(within(correctivoBox).getByText('Sin cliente')).toBeInTheDocument();

    const preventivoBox = screen.getByText('Trimestral').closest('.inv-box')!;
    expect(within(preventivoBox).getByText('Sin cliente')).toBeInTheDocument();
    const fechaLabel = within(preventivoBox).getByText('Fecha');
    const fechaValue = fechaLabel.nextElementSibling as HTMLElement | null;
    expect(fechaValue).not.toBeNull();
    expect(fechaValue).toHaveTextContent('—');
  });
});
