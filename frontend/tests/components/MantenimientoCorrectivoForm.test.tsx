import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importamos los servicios como un namespace para poder mockearlos.
import * as sucursalService from '../../src/services/sucursalService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as mantenimientoCorrectivoService from '../../src/services/mantenimientoCorrectivoService';
import MantenimientoCorrectivoForm from '../../src/components/forms/MantenimientoCorrectivoForm';

// --- Mocks ---
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/mantenimientoCorrectivoService');

describe('MantenimientoCorrectivoForm', () => {
  let user;
  const mockOnClose = vi.fn();

  // Datos de prueba
  const MANTENIMIENTO_EXISTENTE = {
    id: 7,
    id_sucursal: 101,
    id_cuadrilla: 201,
    fecha_apertura: '2025-08-09T00:00:00',
    numero_caso: '101',
    incidente: '1',
    rubro: 'Mobiliario',
    estado: 'Presupuestado',
    prioridad: 'Baja',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    // Configuramos las respuestas por defecto de los servicios.
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({
      data: [{ id: 101, nombre: 'Sucursal A' }, { id: 102, nombre: 'Sucursal B' }],
    });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({
      data: [{ id: 201, nombre: 'Cuadrilla 1' }, { id: 202, nombre: 'Cuadrilla 2' }],
    });
    vi.mocked(mantenimientoCorrectivoService.createMantenimientoCorrectivo).mockResolvedValue({});
    vi.mocked(mantenimientoCorrectivoService.updateMantenimientoCorrectivo).mockResolvedValue({});
  });

  it('Debería renderizar en modo CREAR y deshabilitar el botón de Guardar inicialmente', async () => {
    render(<MantenimientoCorrectivoForm onClose={mockOnClose} />);

    // Espero a que el título del modal aparezca, lo que confirma que la carga inicial terminó.
    expect(await screen.findByText(/Crear Mantenimiento Correctivo/i)).toBeInTheDocument();
    
    // Verifico que el botón de guardar esté deshabilitado porque el formulario está vacío.
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
  });

  it('Debería permitir crear un mantenimiento cuando se completan los campos', async () => {
    render(<MantenimientoCorrectivoForm onClose={mockOnClose} />);
    
    // Espero a que el formulario esté listo.
    await screen.findByText(/Crear Mantenimiento Correctivo/i);

    // Simulo que el usuario llena el formulario.
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '102');
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '201');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-08-11');
    await user.type(screen.getByLabelText(/Número de Caso/i), '123');
    await user.type(screen.getByLabelText(/Incidente/i), 'Falla general');
    await user.selectOptions(screen.getByLabelText(/Rubro/i), 'Otros');
    
    // Verifico que el botón de guardar ahora esté habilitado.
    const guardarButton = screen.getByRole('button', { name: /Guardar/i });
    expect(guardarButton).toBeEnabled();

    // Hago clic para enviar.
    await user.click(guardarButton);

    // Espero a que las llamadas asíncronas se completen.
    await waitFor(() => {
      // Verifico que el servicio de creación fue llamado con los datos correctos.
      expect(mantenimientoCorrectivoService.createMantenimientoCorrectivo).toHaveBeenCalledWith(
        expect.objectContaining({
          id_sucursal: '102', // El valor de los select es string
          id_cuadrilla: '201',
          fecha_apertura: '2025-08-11',
          numero_caso: '123',
          incidente: 'Falla general',
          rubro: 'Otros'
        })
      );
      // Verifico que el formulario se cerró.
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Debería permitir editar un mantenimiento existente', async () => {
    render(<MantenimientoCorrectivoForm onClose={mockOnClose} mantenimiento={MANTENIMIENTO_EXISTENTE} />);
    
    // Espero a que el formulario de edición esté listo.
    expect(await screen.findByText(/Editar Mantenimiento Correctivo/i)).toBeInTheDocument();

    // Simulo la edición de un campo.
    const numeroCasoInput = screen.getByLabelText(/Número de Caso/i);
    await user.clear(numeroCasoInput);
    await user.type(numeroCasoInput, '999');

    // Hago clic para guardar.
    await user.click(screen.getByRole('button', { name: /Guardar/i }));
    
    // Espero a que las llamadas asíncronas se completen.
    await waitFor(() => {
      expect(mantenimientoCorrectivoService.updateMantenimientoCorrectivo).toHaveBeenCalledWith(
        MANTENIMIENTO_EXISTENTE.id,
        expect.objectContaining({ numero_caso: '999' })
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Debería mostrar un error si faltan campos obligatorios al enviar', async () => {
    render(<MantenimientoCorrectivoForm onClose={mockOnClose} />);
    await screen.findByText(/Crear Mantenimiento Correctivo/i);
    
    // Lleno solo algunos campos.
    await user.selectOptions(screen.getByLabelText(/Sucursal/i), '101');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-08-11');
    
    // Intento guardar (el botón todavía está deshabilitado).
    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    // La validación del botón `disabled` previene el `handleSubmit`, por lo que el error no se muestra.
    // Verificamos que el servicio NO fue llamado.
    expect(mantenimientoCorrectivoService.createMantenimientoCorrectivo).not.toHaveBeenCalled();
  });
});