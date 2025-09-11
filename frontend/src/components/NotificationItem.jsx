import React from 'react';
import { Button } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

const NotificationItem = ({ notification, timeAgo, onClick, onDelete }) => {
  const handleContainerClick = (e) => {
    if (e.target.closest('.delete-notification-btn')) return;
    onClick(notification);
  };

  return (
    <div
      onClick={handleContainerClick}
      className="mb-3 p-2 border-bottom hover:bg-gray-100 p-2 rounded d-flex align-items-center"
    >
      <div className="flex-grow-1">
        <p className="mb-1">{notification.mensaje}</p>
        <small className="text-muted">{timeAgo(notification.created_at)}</small>
      </div>
      <div className="d-flex align-items-center">
        {!notification.leida && (
          <span className="bg-warning rounded-circle notification-indicator"></span>
        )}
        <Button
          aria-label="Eliminar notificación"
          variant="outline-danger"
          size="sm"
          onClick={() => onDelete(notification.id)}
          className="ms-2 delete-notification-btn"
        >
          <FaTimes />
        </Button>
      </div>
    </div>
  );
};

export default NotificationItem;