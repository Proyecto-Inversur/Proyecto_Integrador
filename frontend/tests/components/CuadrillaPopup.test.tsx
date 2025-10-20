import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CuadrillaPopup from '../../src/components/maps/CuadrillaPopup';

// --- Mock de Datos ---

const mockCuadrillaCompleta = {
  name: 'Alfa',
  sucursales: [
    { name: 'Sucursal Central' },
    { name: 'Sucursal Norte' }
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
     // Item con datos nulos para probar el fallback
    {
      id: 203,
      nombre_sucursal: 'Sucursal Oeste',
      fecha_apertura: null,
      frecuencia: 'Semanal',
    }
  ],
};

const mockCuadrillaVacia = {
  name: 'Beta',
  sucursales: [],
  correctivos: [],
  preventivos: [],
};

const mockCuadrillaSinArrays = {
  name: 'Gamma',
  // No tiene las propiedades sucursales, correctivos, preventivos
};


describe('CuadrillaPopup', () => {

  it('debería renderizar toda la información cuando los datos están completos', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaCompleta} />);
    
    // Verifica el encabezado
    expect(screen.getByText('Cuadrilla Alfa')).toBeInTheDocument();
    
    // Verifica la lista de sucursales
    const sucursalesSection = screen.getByText('Sucursales').closest('.inv-section');
    expect(within(sucursalesSection).getByText('Sucursal Central')).toBeInTheDocument();
    expect(within(sucursalesSection).getByText('Sucursal Norte')).toBeInTheDocument();

    // Verifica la sección de mantenimientos
    const mantenimientosSection = screen.getByText('Mantenimientos').closest('.inv-section');
    
    // Verifica los datos del correctivo
    expect(within(mantenimientosSection).getByText('C-556')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('En Progreso')).toBeInTheDocument();

    // Verifica los datos del preventivo
    expect(within(mantenimientosSection).getByText('Mensual')).toBeInTheDocument();
    expect(within(mantenimientosSection).getByText('Semanal')).toBeInTheDocument();
  });

  it('debería mostrar "Sin datos" cuando los arrays están vacíos', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaVacia} />);

    // Verifica el encabezado
    expect(screen.getByText('Cuadrilla Beta')).toBeInTheDocument();
    
    // Debería haber 3 mensajes de "Sin datos"
    const sinDatosElements = screen.getAllByText('Sin datos');
    expect(sinDatosElements).toHaveLength(3);
  });
  
  it('debería manejar correctamente las propiedades de array ausentes (undefined)', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaSinArrays} />);

    // Verifica el encabezado
    expect(screen.getByText('Cuadrilla Gamma')).toBeInTheDocument();

    // También debería haber 3 mensajes de "Sin datos"
    const sinDatosElements = screen.getAllByText('Sin datos');
    expect(sinDatosElements).toHaveLength(3);
  });

  it('debería mostrar un guion "—" para valores nulos o indefinidos en un mantenimiento', () => {
    render(<CuadrillaPopup cuadrilla={mockCuadrillaCompleta} />);
    
    // En nuestro mock, el preventivo con id 203 tiene fecha_apertura: null
    // Buscamos el contenedor de ese mantenimiento
    const preventivoBox = screen.getByText('203').closest('.inv-box');
    
    // Dentro de ese contenedor, el valor al lado de "Fecha" debe ser "—"
    const fechaLabel = within(preventivoBox).getByText('Fecha');
    const fechaValue = fechaLabel.nextElementSibling; // El elemento span con la clase 'inv-value'
    
    expect(fechaValue).toHaveTextContent('—');
  });
});