import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import '../styles/formularios.css';

const ColumnSelector = ({ availableColumns, selectedColumns, onSave }) => {
  const [show, setShow] = useState(false);
  const [localSelection, setLocalSelection] = useState(selectedColumns);

  const handleToggle = (key) => {
    setLocalSelection((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleOpen = () => {
    setLocalSelection(selectedColumns);
    setShow(true);
  };

  const handleSave = () => {
    onSave(localSelection);
    setShow(false);
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpen} className="me-2">
        Columnas
      </Button>
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar columnas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableColumns.map((col) => (
            <Form.Check
              key={col.key}
              type="checkbox"
              label={col.label}
              checked={localSelection.includes(col.key)}
              onChange={() => handleToggle(col.key)}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button className="custom-save-button" onClick={handleSave}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ColumnSelector;