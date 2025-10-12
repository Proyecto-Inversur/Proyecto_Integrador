import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PhotoSection from '../../src/components/mantenimientos/PhotoSection';

// Mocks de funciones para las props
const handleSubmit = vi.fn();
const onUpload = vi.fn();
const onDelete = vi.fn();

// Mock para URL.createObjectURL, que no existe en el entorno de JSDOM
// Esto es para que las previsualizaciones de imágenes funcionen en los tests.
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'mock-preview-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Limpiamos los mocks antes de cada test para asegurar que las pruebas son independientes
describe('PhotoSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (props) => {
    const defaultProps = {
      handleSubmit,
      isLoading: false,
      fotos: [],
      onUpload,
      onDelete,
      titulo: 'Fotos de Prueba',
      ...props,
    };
    return render(<PhotoSection {...defaultProps} />);
  };

  it('debería renderizar el título y un mensaje cuando no hay fotos', () => {
    setup();
    expect(screen.getByText('Fotos de Prueba')).toBeInTheDocument();
    expect(screen.getByText('No hay fotos cargadas.')).toBeInTheDocument();
  });

  it('debería renderizar las fotos existentes', () => {
    const mockFotos = ['/path/to/photo1.jpg', '/path/to/photo2.jpg'];
    setup({ fotos: mockFotos });

    expect(screen.getByAltText('Foto 1')).toHaveAttribute('src', '/path/to/photo1.jpg');
    expect(screen.getByAltText('Foto 2')).toHaveAttribute('src', '/path/to/photo2.jpg');
    expect(screen.queryByText('No hay fotos cargadas.')).toBeNull();
  });

  it('debería permitir al usuario seleccionar archivos, llamar a onUpload y mostrar previsualizaciones', async () => {
    setup();
    
    // Simulación de selección de archivos
    const fileInput = screen.getByTestId('file-input'); 
    const file1 = new File(['hello'], 'hello.png', { type: 'image/png' });
    const file2 = new File(['world'], 'world.png', { type: 'image/png' });

    // Disparamos el evento de cambio en el input de archivos
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    // Esperamos a que el estado se actualice y se rendericen los cambios
    await waitFor(() => {
      // Verifica que la lista de archivos seleccionados aparece
      expect(screen.getByText('hello.png')).toBeInTheDocument();
      expect(screen.getByText('world.png')).toBeInTheDocument();
      
      // Verifica que la función onUpload fue llamada con los archivos correctos
      expect(onUpload).toHaveBeenCalledWith([file1, file2]);

      // Verifica que las previsualizaciones se renderizan
      const previews = screen.getAllByAltText(/Nueva foto/);
      expect(previews).toHaveLength(2);
      expect(previews[0]).toHaveAttribute('src', 'mock-preview-url');
    });
  });

  it('debería llamar a handleSubmit al guardar las fotos seleccionadas', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Esperamos que el botón de guardar aparezca
    const saveButton = await screen.findByRole('button', { name: /Guardar Fotos/i });
    fireEvent.click(saveButton);
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
  
  it('debería permitir seleccionar y eliminar fotos existentes', async () => {
    const mockFotos = ['/path/to/photo1.jpg', '/path/to/photo2.jpg'];
    setup({ fotos: mockFotos });
    
    // 1. Entrar en modo selección
    const editButton = screen.getByRole('button', { name: /editar/i }); // BsPencilFill
    fireEvent.click(editButton);
    
    // 2. Seleccionar una foto
    const photoToSelect = screen.getByAltText('Foto 1');
    fireEvent.click(photoToSelect);

    // 3. Hacer clic en el botón de eliminar
    const deleteButton = screen.getByRole('button', { name: /eliminar/i }); // BsTrashFill
    fireEvent.click(deleteButton);

    // 4. Verificar que onDelete fue llamado con la foto seleccionada
    expect(onDelete).toHaveBeenCalledWith(['/path/to/photo1.jpg']);
  });

  it('debería permitir cancelar el modo de selección de borrado', async () => {
    const mockFotos = ['/path/to/photo1.jpg'];
    setup({ fotos: mockFotos });

    // Entrar en modo selección
    const editButton = screen.getByRole('button', { name: /editar/i });
    fireEvent.click(editButton);

    // Hacer clic en cancelar
    const cancelButton = screen.getByRole('button', { name: /cancelar/i }); // BsX
    fireEvent.click(cancelButton);

    // Verificar que el modo de selección se ha cerrado y el botón de editar vuelve a estar
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('debería mostrar un modal al hacer clic en una foto existente (fuera del modo selección)', async () => {
    const mockFotos = ['/path/to/photo1.jpg'];
    setup({ fotos: mockFotos });
    
    // Clic en la imagen para abrir el modal
    fireEvent.click(screen.getByAltText('Foto 1'));
    
    // El modal debería estar visible
    const modalImage = await screen.findByAltText('Full size');
    expect(modalImage).toBeInTheDocument();
    expect(modalImage).toHaveAttribute('src', '/path/to/photo1.jpg');

    // Clic en el botón para cerrar el modal
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    
    // El modal ya no debería estar en el DOM
    await waitFor(() => {
        expect(screen.queryByAltText('Full size')).toBeNull();
    });
  });
});