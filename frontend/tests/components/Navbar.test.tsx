import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../../src/components/Navbar';
import * as useNotifications from '../../src/hooks/useNotifications';

// --- Mocks y Datos de Prueba ---

// Simulamos el hook `useNotifications` para controlar su salida en cada test.
vi.mock('../../src/hooks/useNotifications');

const mockNotifications = [
  { id: 1, mensaje: 'Nuevo correctivo asignado', tipo: 'correctivo', leida: false, created_at: new Date().toISOString() },
  { id: 2, mensaje: 'Preventivo por vencer', tipo: 'preventivo', leida: true, created_at: new Date().toISOString() },
];

// Creamos un objeto con todas las funciones "espía" que devolverá nuestro hook simulado.
const mockUseNotificationsReturn = {
  notifications: [],
  unreadCount: 0,
  showNotifications: false,
  handleShowNotifications: vi.fn(),
  handleCloseNotifications: vi.fn(),
  handleLogout: vi.fn(),
  timeAgo: vi.fn((date) => 'hace un momento'),
  handleClick: vi.fn(),
  handleDeleteNotification: vi.fn(),
  handleMarkAllAsRead: vi.fn(),
  handleDeleteReadNotifications: vi.fn(),
};

describe('Navbar', () => {

  beforeEach(() => {
    // Antes de cada test, limpiamos los mocks y restauramos el estado por defecto del hook.
    vi.clearAllMocks();
    vi.spyOn(useNotifications, 'default').mockReturnValue(mockUseNotificationsReturn);
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  it('Debería mostrar el contador de notificaciones cuando hay notificaciones sin leer', () => {
    // Sobrescribimos el mock para este test específico.
    vi.spyOn(useNotifications, 'default').mockReturnValue({ ...mockUseNotificationsReturn, unreadCount: 3 });
    
    renderWithRouter();

    const counter = screen.getByText('3');
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass('notification-counter');
  });

  it('NO debería mostrar el contador si no hay notificaciones sin leer', () => {
    // Usamos el mock por defecto que tiene unreadCount: 0.
    renderWithRouter();
    
    // `queryByText` devuelve null si no encuentra el elemento, a diferencia de `getByText` que da error.
    expect(screen.queryByText('3')).toBeNull();
  });

  it('Debería llamar a handleShowNotifications al hacer clic en el ícono de la campana', () => {
    renderWithRouter();

    const notificationButton = screen.getByTestId('notif-btn');
    fireEvent.click(notificationButton);

    expect(mockUseNotificationsReturn.handleShowNotifications).toHaveBeenCalledTimes(1);
  });

  it('Debería mostrar el modal con notificaciones si showNotifications es true', () => {
    // Simulamos que el modal está abierto y que hay notificaciones.
    vi.spyOn(useNotifications, 'default').mockReturnValue({
      ...mockUseNotificationsReturn,
      showNotifications: true,
      notifications: mockNotifications,
    });

    renderWithRouter();

    // Verificamos que el contenido del modal y las notificaciones se rendericen.
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Nuevo correctivo asignado')).toBeInTheDocument();
    expect(screen.getByText('Preventivo por vencer')).toBeInTheDocument();
  });
  
  it('Debería mostrar el estado vacío si no hay notificaciones en el modal', () => {
    // Simulamos el modal abierto pero sin notificaciones.
    vi.spyOn(useNotifications, 'default').mockReturnValue({ ...mockUseNotificationsReturn, showNotifications: true, notifications: [] });

    renderWithRouter();

    expect(screen.getByText('No tienes notificaciones.')).toBeInTheDocument();
  });

  it('Debería llamar a las funciones correctas al interactuar con los botones del modal', () => {
    vi.spyOn(useNotifications, 'default').mockReturnValue({
        ...mockUseNotificationsReturn,
        showNotifications: true,
        notifications: mockNotifications,
      });
    renderWithRouter();
    
    // Botón "Marcar leídas"
    fireEvent.click(screen.getByRole('button', { name: /Marcar leídas/i }));
    expect(mockUseNotificationsReturn.handleMarkAllAsRead).toHaveBeenCalledTimes(1);
    
    // Botón "Eliminar leídas"
    fireEvent.click(screen.getByRole('button', { name: /Eliminar leídas/i }));
    expect(mockUseNotificationsReturn.handleDeleteReadNotifications).toHaveBeenCalledTimes(1);

    // Botón "Cerrar Sesión"
    fireEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(mockUseNotificationsReturn.handleLogout).toHaveBeenCalledTimes(1);

    // Clic en una notificación individual
    fireEvent.click(screen.getByText('Nuevo correctivo asignado'));
    expect(mockUseNotificationsReturn.handleClick).toHaveBeenCalledWith(mockNotifications[0]);

    // Botón de eliminar en una notificación
    const deleteButtons = screen.getAllByLabelText('Eliminar notificación');
    fireEvent.click(deleteButtons[0]);
    expect(mockUseNotificationsReturn.handleDeleteNotification).toHaveBeenCalledWith(mockNotifications[0].id, expect.anything());
  });
});