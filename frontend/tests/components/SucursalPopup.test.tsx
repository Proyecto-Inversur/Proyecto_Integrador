import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SucursalPopup from '../../src/components/maps/SucursalPopup';

// --- Mock de Datos ---
// Creamos datos de ejemplo para cubrir diferentes escenarios.
const mockSucursalCompleta = {
  name: 'Sucursal Central',
  Correctivos: [
    {
      id: 101,
      cuadrilla_name: 'Equipo Alfa',
      fecha_apertura: '2025-10-10',
      numero_caso: 'C-123',
      estado: 'Pendiente',
    },
    // Este item tiene un valor nulo para probar el fallback
    {
        id: 102,
        cuadrilla_name: 'Equipo Beta',
        fecha_apertura: '2025-10-11',
        numero_caso: null,
        estado: 'En Progreso',
    }
  ],
  Preventivos: [
    {
      id: 201,
      cuadrilla_name: 'Equipo Gamma',
      fecha_apertura: '2025-10-12',
      frecuencia: 'Mensual',
    },
  ],
};

const mockSucursalVacia = {
  name: 'Sucursal Norte',
  Correctivos: [],
  Preventivos: [],
};

describe('SucursalPopup', () => {

  it('Debería mostrar toda la información de la sucursal y sus mantenimientos', () => {
    render(<SucursalPopup sucursal={mockSucursalCompleta} />);

    // Verifica el encabezado
    expect(screen.getByText('Sucursal Central')).toBeInTheDocument();
    expect(screen.getByText('Sucursal')).toBeInTheDocument();

    // Verifica que los datos de los mantenimientos están presentes
    expect(screen.getByText('Correctivos')).toBeInTheDocument();
    expect(screen.getByText('C-123')).toBeInTheDocument(); // N° de Caso del correctivo
    expect(screen.getByText('Pendiente')).toBeInTheDocument(); // Estado del correctivo

    expect(screen.getByText('Preventivos')).toBeInTheDocument();
    expect(screen.getByText('Mensual')).toBeInTheDocument(); // Frecuencia del preventivo
  });

  it('Debería mostrar "Sin datos" cuando no hay mantenimientos', () => {
    render(<SucursalPopup sucursal={mockSucursalVacia} />);

    // Verifica el encabezado
    expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();

    // Debería haber 2 mensajes de "Sin datos", uno por cada sección
    const sinDatosElements = screen.getAllByText('Sin datos');
    expect(sinDatosElements).toHaveLength(2);
  });

  it('Debería mostrar un guion "—" para valores nulos o indefinidos', () => {
    render(<SucursalPopup sucursal={mockSucursalCompleta} />);

    // En nuestro mock, el correctivo con cuadrilla "Equipo Beta" tiene numero_caso: null
    // Buscamos el contenedor (la caja) de ese mantenimiento específico
    const correctivoBox = screen.getByText('Equipo Beta').closest('.inv-box');

    // Dentro de esa caja, buscamos la etiqueta "N° Caso"
    const casoLabel = within(correctivoBox).getByText('N° Caso');
    
    // El elemento siguiente a la etiqueta debe ser el valor, que debería ser "—"
    const casoValue = casoLabel.nextElementSibling;
    expect(casoValue).toHaveTextContent('—');
  });
});
