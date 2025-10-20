import React from 'react';
// Importo las utilidades de Testing Library para renderizar, buscar elementos y simular eventos.
import { render, screen, waitFor } from '@testing-library/react';
// `userEvent` es una librería que simula interacciones del usuario de forma más realista que `fireEvent`.
import userEvent from '@testing-library/user-event';
// Importo las funciones de Vitest para estructurar los tests.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importo los servicios como un "namespace" para poder mockearlos fácilmente.
import * as preventivoService from '../../src/services/preventivoService';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as sucursalService from '../../src/services/sucursalService';
import * as mantenimientoPreventivoService from '../../src/services/mantenimientoPreventivoService';
// Importo el componente que vamos a probar.
import MantenimientoPreventivoForm from '../../src/components/forms/MantenimientoPreventivoForm';

// --- Mocks ---
// Simulo los módulos de servicios para que no hagan llamadas reales a la API durante los tests.
// Esto nos permite controlar las respuestas y probar el componente de forma aislada y predecible.
vi.mock('../../src/services/preventivoService');
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/mantenimientoPreventivoService');


// Suite de tests para el formulario de Mantenimiento Preventivo.
describe('MantenimientoPreventivoForm', () => {
  // `userEvent` nos permite simular interacciones del usuario (clics, escribir, etc.) de forma más realista.
  let user;
  // Creo un mock para la función `onClose` que se pasa como prop, para verificar si se llama cuando el form se cierra.
  const mockOnClose = vi.fn();

  // Defino datos de prueba constantes para reutilizar en los tests y que sean más legibles.
  const PREVENTIVOS = [
    { id: 1, id_sucursal: 101, nombre_sucursal: 'Sucursal A', frecuencia: 'Mensual' },
    { id: 2, id_sucursal: 102, nombre_sucursal: 'Sucursal B', frecuencia: 'Trimestral' },
  ];
  const CUADRILLAS = [{ id: 1, nombre: 'Cuadrilla 1' }, { id: 2, nombre: 'Cuadrilla 2' }];
  const SUCURSALES = [{ id: 101, nombre: 'Sucursal A' }, { id: 102, nombre: 'Sucursal B' }, { id: 103, nombre: 'Sucursal C' }];
  const MANTENIMIENTO_EXISTENTE = {
    id: 5,
    id_sucursal: 102,
    frecuencia: 'Trimestral',
    id_cuadrilla: 1,
    fecha_apertura: '2025-10-05T00:00:00',
    estado: 'Pendiente',
  };

  // `beforeEach` se ejecuta antes de cada `it`. Lo uso para limpiar los mocks y preparar el entorno de cada prueba.
  beforeEach(() => {
    vi.clearAllMocks(); // Reseteo los contadores de llamadas de los mocks para que un test no afecte al otro.
    user = userEvent.setup(); // Inicializo una nueva instancia de userEvent.
    
    // Configuro las respuestas por defecto de las llamadas a la API que se hacen al montar el formulario.
    vi.mocked(preventivoService.getPreventivos).mockResolvedValue({ data: PREVENTIVOS });
    vi.mocked(cuadrillaService.getCuadrillas).mockResolvedValue({ data: CUADRILLAS });
    vi.mocked(sucursalService.getSucursales).mockResolvedValue({ data: SUCURSALES });
    vi.mocked(mantenimientoPreventivoService.createMantenimientoPreventivo).mockResolvedValue({});
    vi.mocked(mantenimientoPreventivoService.updateMantenimientoPreventivo).mockResolvedValue({});
    vi.mocked(preventivoService.createPreventivo).mockResolvedValue({ data: {} });
  });

  // Test para el modo de edición.
  it('Debería renderizar en modo EDITAR con los datos prellenados', async () => {
    // Renderizo el form pasándole un mantenimiento existente para simular la edición.
    render(<MantenimientoPreventivoForm mantenimiento={MANTENIMIENTO_EXISTENTE} onClose={mockOnClose} />);
    // El form hace una llamada asíncrona al cargar, así que espero a que termine.
    await waitFor(() => expect(preventivoService.getPreventivos).toHaveBeenCalled());
    
    // Verifico que el título sea el de edición.
    expect(screen.getByText('Editar Mantenimiento Preventivo')).toBeInTheDocument();
    // Verifico que los campos del formulario se hayan llenado con los datos del mantenimiento.
    expect(screen.getByRole('button', { name: 'Sucursal B - Trimestral' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Cuadrilla/i)).toHaveValue('1');
    expect(screen.getByLabelText(/Fecha Apertura/i)).toHaveValue('2025-10-05');
  });

  // Test para el flujo completo de creación de un mantenimiento.
  it('Debería guardar en modo CREAR con el payload correcto', async () => {
    render(<MantenimientoPreventivoForm onClose={mockOnClose} />);
    await waitFor(() => expect(preventivoService.getPreventivos).toHaveBeenCalled());

    // Simulo el flujo del usuario:
    // 1. Abrir el dropdown de preventivos y seleccionar una opción.
    await user.click(screen.getByRole('button', {name: /Seleccione un preventivo/i}));
    await user.click(screen.getByText('Sucursal A - Mensual'));
    
    // 2. Llenar el resto de los campos del formulario.
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '2');
    await user.type(screen.getByLabelText(/Fecha Apertura/i), '2025-12-01');
    
    // 3. Hacer clic en el botón de guardar.
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // Espero a que las llamadas asíncronas (el submit) terminen.
    await waitFor(() => {
      // Verifico que se llamó al servicio de creación con el objeto de datos correcto.
      expect(mantenimientoPreventivoService.createMantenimientoPreventivo).toHaveBeenCalledWith({
        id_sucursal: 101,
        frecuencia: 'Mensual',
        id_cuadrilla: 2, 
        fecha_apertura: '2025-12-01',
        estado: 'Pendiente',
      });
      // Verifico que la función para cerrar el modal fue llamada.
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Test para el flujo de actualización de un mantenimiento.
  it('Debería guardar en modo EDITAR con el payload correcto', async () => {
    render(<MantenimientoPreventivoForm mantenimiento={MANTENIMIENTO_EXISTENTE} onClose={mockOnClose} />);
    await waitFor(() => expect(preventivoService.getPreventivos).toHaveBeenCalled());

    // Simulo que el usuario cambia un campo del formulario.
    await user.selectOptions(screen.getByLabelText(/Cuadrilla/i), '2');
    
    // Simulo el guardado.
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // Espero a que las llamadas asíncronas terminen.
    await waitFor(() => {
      // Verifico que se llamó al servicio de actualización con el ID correcto y los datos actualizados.
      expect(mantenimientoPreventivoService.updateMantenimientoPreventivo).toHaveBeenCalledWith(MANTENIMIENTO_EXISTENTE.id, {
        id_sucursal: 102,
        frecuencia: 'Trimestral',
        id_cuadrilla: 2,
        fecha_apertura: '2025-10-05',
        estado: 'Pendiente',
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Test para la funcionalidad de agregar un nuevo tipo de preventivo desde el dropdown.
  it('Debería permitir AGREGAR un nuevo tipo de preventivo', async () => {
    // Preparo el objeto que espero que el componente envíe al servicio para la creación.
    const NUEVO_PREVENTIVO_DATA = { 
        id_sucursal: 103, 
        nombre_sucursal: 'Sucursal C', 
        frecuencia: 'Semestral' 
    };
    // Configuro el mock para que devuelva el nuevo preventivo creado.
    vi.mocked(preventivoService.createPreventivo).mockResolvedValue({ data: { id: 3, ...NUEVO_PREVENTIVO_DATA } });

    render(<MantenimientoPreventivoForm onClose={mockOnClose} />);
    await waitFor(() => expect(preventivoService.getPreventivos).toHaveBeenCalled());

    // Simulo el flujo para abrir el sub-formulario de creación.
    await user.click(screen.getByRole('button', { name: /Seleccione un preventivo/i }));
    await user.click(screen.getByText(/Agregar nuevo preventivo/i));

    // Espero a que aparezcan los nuevos campos y los busco por su etiqueta de accesibilidad.
    const sucursalSelect = await screen.findByLabelText('Sucursal');
    const frecuenciaSelect = await screen.findByLabelText('Frecuencia');

    // Lleno el sub-formulario.
    await user.selectOptions(sucursalSelect, '103');
    await user.selectOptions(frecuenciaSelect, 'Semestral');
    
    // Hago clic en el botón "Agregar" del sub-formulario. Uso una expresión regular exacta (`/^...$/i`)
    // para no confundirlo con el de "Agregar nuevo preventivo...".
    await user.click(screen.getByRole('button', { name: /^Agregar$/i }));

    // Verifico que se haya llamado al servicio para crear el nuevo tipo.
    await waitFor(() => {
      expect(preventivoService.createPreventivo).toHaveBeenCalledWith(NUEVO_PREVENTIVO_DATA);
    });
    
    // Por último, verifico que el dropdown principal se haya actualizado con la nueva opción seleccionada.
    expect(screen.getByRole('button', { name: 'Sucursal C - Semestral' })).toBeInTheDocument();
  });
});