import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapInfoPanel from '../../src/components/maps/MapInfoPanel';

// --- Mock de Datos ---
// Creamos datos de ejemplo para pasarle al componente en los tests.
const mockCuadrillas = [
    { id: 'c1', name: 'Equipo Rayo', correctivos: [1, 2], preventivos: [3] }
];
const mockEncargados = [
    { id: 'e1', name: 'Ana Gómez' }
];
const mockSucursales = [
    { id: 's1', name: 'Sucursal Centro', Correctivos: [1], Preventivos: [] }
];

describe('MapInfoPanel', () => {

  // Creamos funciones "espía" para simular las props.
  const mockOnSelectCuadrilla = vi.fn();
  const mockOnSelectEncargado = vi.fn();
  const mockOnSelectSucursal = vi.fn();
  const mockOnClose = vi.fn();

  // Antes de cada test, limpiamos el historial de las funciones espía.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Props por defecto para no repetir código en cada test.
  const defaultProps = {
    cuadrillas: mockCuadrillas,
    encargados: mockEncargados,
    sucursales: mockSucursales,
    onSelectCuadrilla: mockOnSelectCuadrilla,
    onSelectEncargado: mockOnSelectEncargado,
    onSelectSucursal: mockOnSelectSucursal,
    onClose: mockOnClose,
  };

  it('Debería mostrar todas las secciones y sus ítems correctamente', () => {
    render(<MapInfoPanel {...defaultProps} />);

    // Verificamos que los títulos y los nombres de los ítems estén en el documento.
    expect(screen.getByText('Panel de información')).toBeInTheDocument();
    expect(screen.getByText('Cuadrillas')).toBeInTheDocument();
    expect(screen.getByText('Equipo Rayo')).toBeInTheDocument();
    expect(screen.getByText('Encargados')).toBeInTheDocument();
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('Sucursales')).toBeInTheDocument();
    expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
  });

  it('Debería mostrar mensajes de "No hay..." si los datos están vacíos', () => {
    // Renderizamos el componente sin pasarle datos para usar los arrays vacíos por defecto.
    render(<MapInfoPanel />);

    expect(screen.getByText('No hay cuadrillas activas.')).toBeInTheDocument();
    expect(screen.getByText('No hay encargados disponibles.')).toBeInTheDocument();
    expect(screen.getByText('No hay sucursales activas.')).toBeInTheDocument();
  });

  it('Debería ocultar una sección si su prop "show" es falsa', () => {
    // Renderizamos indicando que no se muestre la sección de Encargados.
    render(<MapInfoPanel {...defaultProps} showEncargados={false} />);

    // La sección de Cuadrillas debería estar visible.
    expect(screen.getByText('Cuadrillas')).toBeInTheDocument();
    // La sección de Encargados NO debería estar visible.
    expect(screen.queryByText('Encargados')).toBeNull();
  });

  it('Debería llamar a las funciones correctas al hacer clic en los elementos', () => {
    render(<MapInfoPanel {...defaultProps} />);

    // 1. Simular clic en el botón de cerrar
    const closeButton = screen.getByRole('button', { name: /Cerrar panel/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // 2. Simular clic en un ítem de cuadrilla
    const cuadrillaItem = screen.getByText('Equipo Rayo');
    fireEvent.click(cuadrillaItem);
    expect(mockOnSelectCuadrilla).toHaveBeenCalledTimes(1);
    expect(mockOnSelectCuadrilla).toHaveBeenCalledWith(mockCuadrillas[0]); // Verificamos que se pasó el objeto correcto

    // 3. Simular clic en un ítem de encargado
    const encargadoItem = screen.getByText('Ana Gómez');
    fireEvent.click(encargadoItem);
    expect(mockOnSelectEncargado).toHaveBeenCalledTimes(1);
    expect(mockOnSelectEncargado).toHaveBeenCalledWith(mockEncargados[0]);

    // 4. Simular clic en un ítem de sucursal
    const sucursalItem = screen.getByText('Sucursal Centro');
    fireEvent.click(sucursalItem);
    expect(mockOnSelectSucursal).toHaveBeenCalledTimes(1);
    expect(mockOnSelectSucursal).toHaveBeenCalledWith(mockSucursales[0]);
  });
});