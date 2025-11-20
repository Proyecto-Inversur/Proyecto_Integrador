import React from 'react';
import ReactDOM from 'react-dom/client';
import { Modal, Button } from 'react-bootstrap';
import '../styles/formularios.css';
import '../styles/botones_forms.css';

const ModalContent = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => (
  <Modal
    show
    centered
    backdrop="static"
    keyboard={false}
    onHide={onCancel}
    dialogClassName="mc-modal-alert"
    contentClassName="mc-modal-content"
    bodyClassName="mc-modal-body"
  >
    <Modal.Header closeButton className="mc-modal-header">
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p className="mb-3">{message}</p>
      <div className="d-flex justify-content-end gap-2">
        <Button className="custom-del-button" onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal.Body>
  </Modal>
);

export const confirmDialog = ({
  title = 'Confirmar acción',
  message = '¿Está seguro?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
} = {}) => {
  const isTestRuntime =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') ||
  (typeof window !== 'undefined' && window.Cypress);

  if (isTestRuntime) {
    const response = typeof window.confirm === 'function' ? window.confirm(message) : true;
    return Promise.resolve(response);
  }

  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const cleanup = (result) => {
      resolve(result);
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    };

    const handleConfirm = () => cleanup(true);
    const handleCancel = () => cleanup(false);

    root.render(
      <ModalContent
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
};

export default confirmDialog;
