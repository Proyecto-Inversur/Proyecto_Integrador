import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataTable from '../../src/components/DataTable';
import * as preferencesService from '../../src/services/preferencesService';

// --- Mocks ---

// Simulamos el servicio de preferencias para controlar sus respuestas en los tests.
vi.mock('../../src/services/preferencesService');

// Simulamos el componente ColumnSelector para probar la integración sin depender de su lógica interna.
// Creamos un botón que nos permite simular el evento `onSave` con datos de prueba.
vi.mock('../../src/components/ColumnSelector', () => ({
  default: ({ onSave }) => (
    <button onClick={() => onSave(['id', 'email'])}>
      Simular Guardar Columnas
    </button>
  ),
}));

// --- Datos de Prueba ---
const mockColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const mockData = [
  { id: 1, name: 'Usuario Uno', email: 'user1@example.com' },
  { id: 2, name: 'Usuario Dos', email: 'user2@example.com' },
];

const entityKey = 'users';

describe('DataTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRowClick = vi.fn();

  beforeEach(() => {
    // Limpiamos todos los mocks antes de cada test.
    vi.clearAllMocks();
    // Establecemos un comportamiento por defecto para la carga de preferencias.
    vi.mocked(preferencesService.getColumnPreferences).mockResolvedValue({ data: { columns: ['id', 'name', 'email', 'acciones'] } });
    vi.mocked(preferencesService.saveColumnPreferences).mockResolvedValue({});
  });

  it('Debería cargar y aplicar las preferencias de columnas guardadas', async () => {
    // Hacemos que el servicio devuelva solo 'id' y 'name'.
    const savedCols = ['id', 'name'];
    vi.mocked(preferencesService.getColumnPreferences).mockResolvedValueOnce({ data: { columns: savedCols } });

    render(<DataTable columns={mockColumns} data={mockData} entityKey={entityKey} />);
    
    // Como la carga es asíncrona, esperamos a que el componente se actualice.
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
      // Verificamos que las columnas no seleccionadas NO están en el documento.
      expect(screen.queryByRole('columnheader', { name: 'Email' })).toBeNull();
    });
  });

  it('Debería mostrar todas las columnas si falla la carga de preferencias', async () => {
    // Simulamos un error en la llamada al servicio.
    vi.mocked(preferencesService.getColumnPreferences).mockRejectedValueOnce(new Error('API Error'));

    render(<DataTable columns={mockColumns} data={mockData} entityKey={entityKey} />);

    await waitFor(() => {
      // Verificamos que la tabla muestra todas las columnas como fallback.
      expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    });
  });

  it('Debería llamar a onRowClick al hacer clic en una fila', async () => {
    render(<DataTable columns={mockColumns} data={mockData} entityKey={entityKey} onRowClick={mockOnRowClick} />);

    // Esperamos a que los datos se rendericen.
    const firstRowCell = await screen.findByText('Usuario Uno');
    // Hacemos clic en la fila (`tr`) que contiene la celda.
    fireEvent.click(firstRowCell.closest('tr'));

    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('Debería llamar a onEdit y onDelete sin disparar onRowClick', async () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        entityKey={entityKey}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRowClick={mockOnRowClick}
      />
    );

    // Buscamos todos los botones de editar y hacemos clic en el primero.
    const editButtons = await screen.findAllByLabelText('Editar');
    fireEvent.click(editButtons[0]);

    // Verificamos que solo onEdit fue llamado.
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
    expect(mockOnRowClick).not.toHaveBeenCalled();

    // Buscamos todos los botones de eliminar y hacemos clic en el segundo.
    const deleteButtons = await screen.findAllByLabelText('Eliminar');
    fireEvent.click(deleteButtons[1]);
    
    // Verificamos que solo onDelete fue llamado.
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[1].id);
    expect(mockOnRowClick).not.toHaveBeenCalled();
  });

  it('Debería guardar las nuevas preferencias y actualizar las columnas visibles', async () => {
    render(<DataTable columns={mockColumns} data={mockData} entityKey={entityKey} />);

    // Esperamos a que la tabla se renderice con las columnas iniciales.
    await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    });

    // Encontramos y hacemos clic en el botón de nuestro ColumnSelector simulado.
    const saveColsButton = screen.getByRole('button', { name: 'Simular Guardar Columnas' });
    fireEvent.click(saveColsButton);
    
    // Esperamos a que se completen las actualizaciones de estado y efectos.
    await waitFor(() => {
      // 1. Verificamos que se intentó guardar la nueva preferencia.
      expect(preferencesService.saveColumnPreferences).toHaveBeenCalledWith(entityKey, ['id', 'email']);
      
      // 2. Verificamos que la tabla se actualizó y ahora muestra las nuevas columnas.
      expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
      
      // 3. Verificamos que la columna 'Nombre' ya no está visible.
      expect(screen.queryByRole('columnheader', { name: 'Nombre' })).toBeNull();
    });
  });
});