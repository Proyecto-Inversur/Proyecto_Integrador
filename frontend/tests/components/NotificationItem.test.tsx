import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationItem from '../../src/components/NotificationItem';

// --- Mock de Datos ---
const mockUnreadNotification = {
  id: 1,
  mensaje: 'Esta es una notificación no leída',
  created_at: new Date().toISOString(),
  leida: false,
};

const mockReadNotification = {
  id: 2,
  mensaje: 'Esta es una notificación ya leída',
  created_at: new Date().toISOString(),
  leida: true,
};

describe('NotificationItem', () => {

  // Creamos funciones "espía" para las props.
  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockTimeAgo = vi.fn(() => 'hace 5 minutos');

  beforeEach(() => {
    // Limpiamos los mocks antes de cada test.
    vi.clearAllMocks();
  });

  it('Debería renderizar el mensaje y la fecha, y mostrar el indicador de "no leída"', () => {
    render(
      <NotificationItem
        notification={mockUnreadNotification}
        timeAgo={mockTimeAgo}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Verificamos que el mensaje y la fecha se muestren.
    expect(screen.getByText('Esta es una notificación no leída')).toBeInTheDocument();
    expect(screen.getByText('hace 5 minutos')).toBeInTheDocument();
    
    // Verificamos que la función para formatear la fecha fue llamada.
    expect(mockTimeAgo).toHaveBeenCalledWith(mockUnreadNotification.created_at);

    // Verificamos que el indicador de "no leída" está visible.
    expect(document.querySelector('.notification-indicator')).toBeInTheDocument();
  });

  it('NO debería mostrar el indicador de "no leída" si la notificación ya fue leída', () => {
    render(
      <NotificationItem
        notification={mockReadNotification}
        timeAgo={mockTimeAgo}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Usamos querySelector porque esperamos que el elemento NO exista.
    expect(document.querySelector('.notification-indicator')).toBeNull();
  });

  it('Debería llamar a la función onClick al hacer clic en el contenedor', () => {
    render(
      <NotificationItem
        notification={mockUnreadNotification}
        timeAgo={mockTimeAgo}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Hacemos clic en el texto de la notificación para disparar el evento del contenedor.
    fireEvent.click(screen.getByText('Esta es una notificación no leída'));

    // Verificamos que onClick fue llamado con el objeto de notificación correcto.
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(mockUnreadNotification);
  });

  it('Debería llamar a onDelete pero NO a onClick al hacer clic en el botón de eliminar', () => {
    render(
      <NotificationItem
        notification={mockUnreadNotification}
        timeAgo={mockTimeAgo}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Buscamos el botón de eliminar por su etiqueta de accesibilidad.
    const deleteButton = screen.getByRole('button', { name: /Eliminar notificación/i });
    fireEvent.click(deleteButton);

    // Verificamos que onDelete fue llamado con el ID correcto.
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockUnreadNotification.id);

    // Nos aseguramos de que el clic no se propagó al contenedor.
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});