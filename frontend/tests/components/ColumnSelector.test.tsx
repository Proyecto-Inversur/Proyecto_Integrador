import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ColumnSelector from '../../src/components/ColumnSelector';

// --- Mock de Datos ---
// Definimos las columnas disponibles y las que están seleccionadas por defecto.
const mockAvailableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'role', label: 'Rol' },
];

const mockSelectedColumns = ['id', 'name'];

describe('ColumnSelector', () => {

  // Creamos una función "espía" para simular la prop onSave.
  const mockOnSave = vi.fn();

  beforeEach(() => {
    // Limpiamos el historial de llamadas antes de cada test.
    vi.clearAllMocks();
  });

  it('Debería mostrar solo el botón de edición inicialmente', () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );

    // El botón para abrir el modal debe estar visible.
    expect(screen.getByRole('button', { name: /Seleccionar columnas/i })).toBeInTheDocument();
    
    // El título del modal no debe estar visible, lo que implica que el modal está cerrado.
    expect(screen.queryByText('Seleccionar columnas')).toBeNull();
  });

  it('Debería abrir el modal y mostrar los checkboxes correctos al hacer clic en el botón', () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );

    // Hacemos clic en el botón para abrir el modal.
    const openButton = screen.getByRole('button', { name: /Seleccionar columnas/i });
    fireEvent.click(openButton);

    // Ahora el título del modal sí debe estar visible.
    expect(screen.getByText('Seleccionar columnas')).toBeInTheDocument();

    // Verificamos que los checkboxes reflejen el estado inicial.
    expect(screen.getByLabelText('ID')).toBeChecked();
    expect(screen.getByLabelText('Nombre')).toBeChecked();
    expect(screen.getByLabelText('Correo Electrónico')).not.toBeChecked();
    expect(screen.getByLabelText('Rol')).not.toBeChecked();
  });

  it('Debería permitir al usuario cambiar la selección de columnas', () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar columnas/i }));

    const emailCheckbox = screen.getByLabelText('Correo Electrónico');
    const nameCheckbox = screen.getByLabelText('Nombre');

    // 1. Marcar una casilla desmarcada.
    fireEvent.click(emailCheckbox);
    expect(emailCheckbox).toBeChecked();

    // 2. Desmarcar una casilla marcada.
    fireEvent.click(nameCheckbox);
    expect(nameCheckbox).not.toBeChecked();
  });

  it('Debería llamar a onSave con la nueva selección y cerrar el modal al guardar', () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar columnas/i }));

    // Cambiamos la selección: desmarcamos 'Nombre' y marcamos 'Rol'.
    fireEvent.click(screen.getByLabelText('Nombre'));
    fireEvent.click(screen.getByLabelText('Rol'));

    // Hacemos clic en guardar.
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    // Verificamos que onSave fue llamado con el nuevo array de columnas seleccionadas.
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(['id', 'role']);

    // Verificamos que el modal se cerró.
    expect(screen.queryByText('Seleccionar columnas')).toBeNull();
  });

  it('No debería llamar a onSave si el modal se cierra sin guardar', () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Seleccionar columnas/i }));

    // Hacemos clic en el botón de cerrar del modal (el que tiene la 'x').
    const closeButton = screen.getByRole('button', { name: /Close/i }); // 'Close' es el aria-label por defecto de react-bootstrap
    fireEvent.click(closeButton);

    // Verificamos que la función de guardado NUNCA fue llamada.
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Y que el modal se cerró.
    expect(screen.queryByText('Seleccionar columnas')).toBeNull();
  });
});