import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Sucursales from '../../src/pages/Sucursales';
import * as sucursalService from '../../src/services/sucursalService';
import * as zonaService from '../../src/services/zonaService';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../../src/services/sucursalService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/api');

describe('Sucursales component', () => {
  const mockSucursales = [
    { id: 1, nombre: 'Sucursal 1', zona: 'Zona A', direccion: 'Calle 123', superficie: '100' },
    { id: 2, nombre: 'Sucursal 2', zona: 'Zona B', direccion: 'Avenida 456', superficie: '200' },
  ];

  const mockZonas = [{ id: 1, nombre: 'Zona A' }, { id: 2, nombre: 'Zona B' }];

  beforeEach(() => {
    vi.clearAllMocks();
    sucursalService.getSucursales.mockResolvedValue({ data: mockSucursales });
    zonaService.getZonas.mockResolvedValue({ data: mockZonas });
  });

  test('muestra sucursales en la tabla', async () => {
    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    expect(screen.getByText('Gestión de Sucursales')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sucursal 1')).toBeInTheDocument();
      expect(screen.getByText('Sucursal 2')).toBeInTheDocument();
    });
  });

  test('al hacer click en Agregar muestra el formulario', async () => {
    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Agregar/i));

    await waitFor(() => {
      expect(screen.getByText(/Crear Sucursal/i)).toBeInTheDocument();
    });
  });

  test('debería eliminar una sucursal', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [{ id: 1, nombre: 'Sucursal 1', zona: 'Zona A', direccion: 'Calle 123', superficie: '100' }],
    });
    sucursalService.deleteSucursal.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    const eliminarButton = await screen.findByRole('button', { name: /Eliminar/i });
    fireEvent.click(eliminarButton);

    await waitFor(() => {
      expect(sucursalService.deleteSucursal).toHaveBeenCalledWith(1);
    });
  });
  
  test('debería editar una sucursal', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [{ id: 1, nombre: 'Sucursal 2', zona: 'Zona B', direccion: 'Avenida 456', superficie: '200' }],
    });

    render(
      <BrowserRouter>
        <Sucursales />
      </BrowserRouter>
    );

    const editarButton = await screen.findByRole('button', { name: /Editar/i });
    fireEvent.click(editarButton);

    expect(await screen.findByDisplayValue('Sucursal 2')).toBeInTheDocument();
  });  
});


