// frontend/src/components/mantenimientos/MantenimientoInfo.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MantenimientoInfo from '../../src/components/mantenimientos/MantenimientoInfo';

// Mocks de datos para las props
const mockMantenimiento = {
  id_sucursal: 1,
  id_cuadrilla: 1,
  fecha_apertura: '2023-10-26T10:00:00Z',
  fecha_cierre: null,
  numero_caso: 'CASO-123',
  incidente: 'Falla en el sistema',
  rubro: 'Electricidad',
  prioridad: 'Alta',
  estado: 'Pendiente',
  extendido: '2023-10-27T14:00:00Z',
  frecuencia: 'Mensual',
};

const mockFormData = {
  extendido: '',
  estado: 'Pendiente',
};

// Mocks de funciones para las props
const getSucursalNombre = vi.fn((id) => `Sucursal ${id}`);
const getCuadrillaNombre = vi.fn((id) => `Cuadrilla ${id}`);
const getZonaNombre = vi.fn((id) => `Zona ${id}`);
const formatExtendido = vi.fn((date) => new Date(date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' }).replace(/\//g, '/').replace(',', ','));
const handleExtendidoChange = vi.fn();
const handleSubmit = vi.fn((e) => e.preventDefault());
const toggleRoute = vi.fn();
const handleFinish = vi.fn();
const handleChange = vi.fn();

describe('MantenimientoInfo', () => {
  // Se asegura que los mocks se reseteen antes de cada test.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (props) => {
    const defaultProps = {
      title: 'Título de Prueba',
      mantenimiento: mockMantenimiento,
      isUser: false,
      formData: mockFormData,
      getSucursalNombre,
      getCuadrillaNombre,
      getZonaNombre,
      formatExtendido,
      handleExtendidoChange,
      handleSubmit,
      error: null,
      success: null,
      toggleRoute,
      isSelected: false,
      isLoading: false,
      showFinishButton: false,
      handleFinish,
      handleChange,
      ...props,
    };
    return render(<MantenimientoInfo {...defaultProps} />);
  };

  it('debería renderizar la información básica del mantenimiento', () => {
    setup({});
    expect(screen.getByText('Título de Prueba')).toBeInTheDocument();
    expect(screen.getByText(/Sucursal - Frecuencia:/i)).toBeInTheDocument();
    expect(screen.getByText('Sucursal 1 - Mensual')).toBeInTheDocument();
    expect(screen.getByText('Cuadrilla 1')).toBeInTheDocument();
    expect(screen.getByText('Zona 1')).toBeInTheDocument();
    expect(screen.getByText('2023-10-26')).toBeInTheDocument();
    expect(screen.getByText('CASO-123')).toBeInTheDocument();
    expect(screen.getByText('Falla en el sistema')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento no finalizado')).toBeInTheDocument();
  });

  it('no debería mostrar campos opcionales si no existen datos', () => {
    const mantenimientoSinOpcionales = { ...mockMantenimiento, numero_caso: null, incidente: null, rubro: null, prioridad: null, estado: null, frecuencia: null };
    setup({ mantenimiento: mantenimientoSinOpcionales });

    expect(screen.queryByText('Numero de Caso:')).toBeNull();
    expect(screen.queryByText('Incidente:')).toBeNull();
    expect(screen.queryByText('Rubro:')).toBeNull();
    expect(screen.queryByText('Prioridad:')).toBeNull();
    expect(screen.queryByText('Estado:')).toBeNull();
    expect(screen.getByText('Sucursal:')).toBeInTheDocument();
  });

  // --- Tests para la vista de Administrador/No-Usuario ---
  describe('cuando isUser es false', () => {
    it('debería mostrar el formulario de extendido y el botón de ruta', () => {
      setup({ isUser: false });
      expect(screen.getByLabelText('Extendido:')).toBeInTheDocument();
      expect(screen.getByText('Agregar a la ruta actual')).toBeInTheDocument();
    });

    it('debería mostrar el botón "Guardar Información" al cambiar el extendido', () => {
      setup({ isUser: false, formData: { ...mockFormData, extendido: '2023-11-10T10:00' } });
      expect(screen.getByText('Guardar Información')).toBeInTheDocument();
    });

    it('debería llamar a handleSubmit al guardar el extendido', () => {
        setup({ isUser: false, formData: { ...mockFormData, extendido: '2023-11-10T10:00' } });
        const saveButton = screen.getByText('Guardar Información');
        fireEvent.click(saveButton);
        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('debería llamar a toggleRoute al hacer clic en el botón de ruta', () => {
      setup({ isUser: false });
      const routeButton = screen.getByText('Agregar a la ruta actual');
      fireEvent.click(routeButton);
      expect(toggleRoute).toHaveBeenCalledTimes(1);
    });

    it('debería mostrar "Borrar de la ruta" si isSelected es true', () => {
      setup({ isUser: false, isSelected: true });
      expect(screen.getByText('Borrar de la ruta')).toBeInTheDocument();
    });
  });

  // --- Tests para la vista de Cuadrilla ---
  describe('cuando showFinishButton es true', () => {
    it('debería mostrar el botón para finalizar y llamar a handleFinish al hacer clic', () => {
      setup({ showFinishButton: true });
      const finishButton = screen.getByText('Marcar como finalizado');
      expect(finishButton).toBeInTheDocument();
      fireEvent.click(finishButton);
      expect(handleFinish).toHaveBeenCalledTimes(1);
    });
  });

  // --- Tests para la vista de Usuario ---
  describe('cuando isUser es true', () => {
    it('debería mostrar el formulario para cambiar el estado', () => {
      setup({ isUser: true, handleChange: vi.fn() });
      expect(screen.getByLabelText('Estado')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Pendiente')).toBeInTheDocument();
    });

    it('debería mostrar el botón "Guardar Estado" cuando el estado cambia', () => {
      setup({
        isUser: true,
        handleChange: vi.fn(),
        formData: { ...mockFormData, estado: 'En Progreso' },
      });
      const saveButton = screen.getByText('Guardar Estado');
      expect(saveButton).toBeInTheDocument();
    });
    
    it('debería llamar a handleSubmit al guardar el estado', () => {
        setup({
            isUser: true,
            handleChange: vi.fn(),
            formData: { ...mockFormData, estado: 'En Progreso' },
        });
        const saveButton = screen.getByText('Guardar Estado');
        fireEvent.click(saveButton);
        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('no debería mostrar el formulario de extendido ni el botón de ruta', () => {
        setup({ isUser: true });
        expect(screen.queryByLabelText('Extendido:')).toBeNull();
        expect(screen.queryByText('Agregar a la ruta actual')).toBeNull();
    });
  });

  // --- Tests para mensajes de error y éxito ---
  it('debería mostrar un mensaje de error', () => {
    setup({ error: 'Hubo un error' });
    expect(screen.getByText('Hubo un error')).toBeInTheDocument();
  });

  it('debería mostrar un mensaje de éxito', () => {
    setup({ success: 'Operación exitosa' });
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });
});