import { useEffect, useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { createCliente, updateCliente } from '../../services/clienteService';
import '../../styles/formularios.css';

const emptyCliente = { nombre: '', contacto: '', email: '' };

const ClienteForm = ({ 
  show, 
  cliente, 
  onClose, 
  onSaved,
  setError,
  setSuccess
}) => {
  const [formData, setFormData] = useState(emptyCliente);
  const [error_form, setError_form] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        contacto: cliente.contacto || '',
        email: cliente.email || '',
      });
    } else {
      setFormData(emptyCliente);
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError_form(null);

    try {
      if (!formData.nombre || !formData.contacto || !formData.email) {
        setError_form('Todos los campos son obligatorios.');
        return;
      }

      if (cliente) {
        await updateCliente(cliente.id, formData);
      } else {
        await createCliente(formData);
      }
      setError(null);
      setSuccess(cliente ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar');
      setSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error_form && <Alert variant="danger">{error_form}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="clienteNombre">
            <Form.Label className="required required-asterisk">Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="clienteContacto">
            <Form.Label className="required required-asterisk">Contacto</Form.Label>
            <Form.Control
              type="text"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="clienteEmail">
            <Form.Label className="required required-asterisk">Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button className="custom-save-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ClienteForm;
