import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { FiEdit } from 'react-icons/fi';
import '../styles/formularios.css';

const ColumnSelector = ({ availableColumns, selectedColumns, onSave, buttonClass = 'custom-col-selector',}) => {
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
    <div className='columnas'>
      <Button
        variant="primary"
        onClick={handleOpen}
        className={`me-2 ${buttonClass}`}  
        aria-label="Seleccionar columnas"
      >
        <FiEdit />
      </Button>
      <Modal show={show} onHide={() => setShow(false)} 
        dialogClassName="column-selector-modal"
      >
        <Modal.Header closeButton className="column-selector-header">
          <Modal.Title>Seleccionar columnas</Modal.Title>
        </Modal.Header>
        <Modal.Body className="column-selector-body">
          {availableColumns.map((col) => (
            <Form.Check
              key={col.key}
              id={`col-${col.key}`}
              type="checkbox"
              label={col.label}
              checked={localSelection.includes(col.key)}
              onChange={() => handleToggle(col.key)}
            />
          ))}
        </Modal.Body>
        <Modal.Footer className="column-selector-footer">
          <Button className="custom-save-button" onClick={handleSave}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ColumnSelector;