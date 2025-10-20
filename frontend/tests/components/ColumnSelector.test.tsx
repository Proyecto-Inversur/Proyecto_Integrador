import React from 'react';
// 1. Importo `waitForElementToBeRemoved`
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ColumnSelector from '../../src/components/ColumnSelector';

// --- Mock de Datos ---
const mockAvailableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'role', label: 'Rol' },
];

const mockSelectedColumns = ['id', 'name'];

describe('ColumnSelector', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
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
    expect(screen.getByRole('button', { name: /Seleccionar columnas/i })).toBeInTheDocument();
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
    const openButton = screen.getByRole('button', { name: /Seleccionar columnas/i });
    fireEvent.click(openButton);

    expect(screen.getByText('Seleccionar columnas')).toBeInTheDocument();
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

    fireEvent.click(emailCheckbox);
    expect(emailCheckbox).toBeChecked();
    fireEvent.click(nameCheckbox);
    expect(nameCheckbox).not.toBeChecked();
  });

  // 2. Convierto el test en una función `async`.
  it('Debería llamar a onSave con la nueva selección y cerrar el modal al guardar', async () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Seleccionar columnas/i }));

    fireEvent.click(screen.getByLabelText('Nombre'));
    fireEvent.click(screen.getByLabelText('Rol'));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    // 3. Espero a que el modal se elimine del DOM antes de continuar.
    await waitForElementToBeRemoved(() => screen.queryByText('Seleccionar columnas'));

    // Ahora las verificaciones son seguras.
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(['id', 'role']);
  });

  // 4. Convierto este test también en `async`.
  it('No debería llamar a onSave si el modal se cierra sin guardar', async () => {
    render(
      <ColumnSelector
        availableColumns={mockAvailableColumns}
        selectedColumns={mockSelectedColumns}
        onSave={mockOnSave}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Seleccionar columnas/i }));

    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);

    // 5. Espero a que el modal se elimine del DOM.
    await waitForElementToBeRemoved(() => screen.queryByText('Seleccionar columnas'));

    // Verifico que `onSave` no fue llamado.
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});