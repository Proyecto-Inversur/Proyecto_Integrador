import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PlanillaSection from '../../src/components/mantenimientos/PlanillaSection';

// Mock para URL.createObjectURL, necesario para las previsualizaciones.
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'mock-preview-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mocks de todas las funciones pasadas como props
const mockSetFormData = vi.fn();
const mockHandleSubmit = vi.fn();
const mockDeletePlanilla = vi.fn(() => Promise.resolve());
const mockHandleImageClick = vi.fn();
const mockFetchMantenimiento = vi.fn(() => Promise.resolve());
const mockSetIsLoading = vi.fn();
const mockSetSuccess = vi.fn();
const mockSetError = vi.fn();

const mockMantenimiento = { id: 1 };

describe('PlanillaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (props = {}, isMultiple = false) => {
    const defaultProps = {
      multiple: isMultiple,
      mantenimiento: mockMantenimiento,
      formData: isMultiple ? { planillas: [] } : { planilla: null },
      setFormData: mockSetFormData,
      handleSubmit: mockHandleSubmit,
      deletePlanilla: mockDeletePlanilla,
      handleImageClick: mockHandleImageClick,
      fetchMantenimiento: mockFetchMantenimiento,
      setIsLoading: mockSetIsLoading,
      isLoading: false,
      setSuccess: mockSetSuccess,
      setError: mockSetError,
      ...props,
    };
    return render(<PlanillaSection {...defaultProps} />);
  };

  describe('Modo Singular (multiple=false)', () => {
    it('debería renderizar el título en singular y el mensaje de "no hay planilla"', () => {
      setup({}, false);
      expect(screen.getByText('Planilla')).toBeInTheDocument();
      expect(screen.getByText('No hay planilla cargada.')).toBeInTheDocument();
    });

    it('debería permitir seleccionar un archivo, llamar a setFormData y mostrar el nombre del archivo', async () => {
      const { rerender } = setup({}, false); // Obtenemos rerender
      const fileInput = screen.getByLabelText(/cargar/i);
      const file = new File(['planilla1'], 'planilla1.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Verificamos que el manejador de estado fue llamado
      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalled();
      });

      // Simulamos la actualización de props volviendo a renderizar
      const newProps = {
        multiple: false,
        mantenimiento: mockMantenimiento,
        formData: { planilla: file }, 
        setFormData: mockSetFormData,
        handleSubmit: mockHandleSubmit,
        deletePlanilla: mockDeletePlanilla,
        handleImageClick: mockHandleImageClick,
        fetchMantenimiento: mockFetchMantenimiento,
        setIsLoading: mockSetIsLoading,
        isLoading: false,
        setSuccess: mockSetSuccess,
        setError: mockSetError,
      };
      rerender(<PlanillaSection {...newProps} />);
      
      // Nombre del archivo debe ser visible
      expect(await screen.findByText('planilla1.png')).toBeInTheDocument();
    });

    it('debería llamar a handleSubmit al guardar la planilla', async () => {
        const file = new File(['planilla1'], 'planilla1.png', { type: 'image/png' });
        setup({ formData: { planilla: file } }, false);

        const saveButton = screen.getByRole('button', { name: /Guardar Planilla/i });
        fireEvent.click(saveButton);

        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('debería permitir seleccionar y eliminar una planilla existente', async () => {
      const mantenimientoConPlanilla = { id: 1, planilla: '/uploads/planilla_existente.jpg' };
      setup({ mantenimiento: mantenimientoConPlanilla }, false);

      const editButton = screen.getByRole('button', { name: /editar/i });
      fireEvent.click(editButton);

      const planillaImg = screen.getByAltText('Planilla existente');
      fireEvent.click(planillaImg);
      
      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockSetIsLoading).toHaveBeenCalledWith(true);
        expect(mockDeletePlanilla).toHaveBeenCalledWith(1, 'planilla_existente.jpg');
        expect(mockFetchMantenimiento).toHaveBeenCalled();
        expect(mockSetSuccess).toHaveBeenCalledWith('Planilla(s) eliminada(s) correctamente.');
        expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Modo Múltiple (multiple=true)', () => {
    it('debería renderizar el título en plural y el mensaje de "no hay planillas"', () => {
      setup({}, true);
      expect(screen.getByText('Planillas')).toBeInTheDocument();
      expect(screen.getByText('No hay planillas cargadas.')).toBeInTheDocument();
    });

    it('debería permitir seleccionar múltiples archivos, llamar a setFormData y mostrarlos', async () => {
      const { rerender } = setup({}, true); // Obtenemos rerender
      const fileInput = screen.getByLabelText(/cargar/i);
      const file1 = new File(['p1'], 'p1.png', { type: 'image/png' });
      const file2 = new File(['p2'], 'p2.png', { type: 'image/png' });
      
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalled();
      });

      // Simulamos la actualización de props
      const newProps = {
        multiple: true,
        mantenimiento: mockMantenimiento,
        formData: { planillas: [file1, file2] },
        setFormData: mockSetFormData,
        handleSubmit: mockHandleSubmit,
        deletePlanilla: mockDeletePlanilla,
        handleImageClick: mockHandleImageClick,
        fetchMantenimiento: mockFetchMantenimiento,
        setIsLoading: mockSetIsLoading,
        isLoading: false,
        setSuccess: mockSetSuccess,
        setError: mockSetError,
      };
      rerender(<PlanillaSection {...newProps} />);

      // Nombre del archivo debe ser visible
      expect(await screen.findByText('p1.png')).toBeInTheDocument();
      expect(await screen.findByText('p2.png')).toBeInTheDocument();
    });

    it('debería permitir seleccionar y eliminar múltiples planillas existentes', async () => {
        const mantenimientoConPlanillas = { id: 1, planillas: ['/uploads/p1.jpg', '/uploads/p2.jpg'] };
        setup({ mantenimiento: mantenimientoConPlanillas }, true);

        const editButton = screen.getByRole('button', { name: /editar/i });
        fireEvent.click(editButton);

        fireEvent.click(screen.getByAltText('Planilla 1'));
        fireEvent.click(screen.getByAltText('Planilla 2'));

        const deleteButton = screen.getByRole('button', { name: /eliminar/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockDeletePlanilla).toHaveBeenCalledTimes(2);
            expect(mockDeletePlanilla).toHaveBeenCalledWith(1, 'p1.jpg');
            expect(mockDeletePlanilla).toHaveBeenCalledWith(1, 'p2.jpg');
            expect(mockFetchMantenimiento).toHaveBeenCalledTimes(1);
        });
    });
  });
});