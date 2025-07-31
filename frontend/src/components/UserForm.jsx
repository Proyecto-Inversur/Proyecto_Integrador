import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createUser, updateUser } from '../services/userService';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import '../styles/formularios.css';

const UserForm = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rol: 'Administrador',
  });
  const [error, setError] = useState(null);
  const { signInWithGoogle } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        rol: user.rol,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      if (user) {
        await updateUser(user.id, formData);
      } else {
        const { idToken, email } = await signInWithGoogle();
        const payload = { ...formData, email: email, id_token: idToken };
        await createUser(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message || 'Error al guardar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.nombre.trim() && formData.rol;
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{user ? 'Editar Usuario' : 'Crear Usuario'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
            <div className="custom-div">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <div>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="nombre">
                  <Form.Label className="required required-asterisk">Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="rol">
                  <Form.Label className="required required-asterisk">Rol</Form.Label>
                  <Form.Select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                    className='form-select'
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Encargado de Mantenimiento">Encargado de Mantenimiento</option>
                  </Form.Select>
                </Form.Group>
                <Button
                  className="custom-save-button d-flex align-items-center justify-content-center gap-2"
                  type="submit"
                  disabled={!isFormValid()}
                >
                  <FcGoogle size={20} />
                  {user ? 'Guardar' : 'Registrar con Google'}
                </Button>
              </Form>
            </div>
          )}
        </Modal.Body>
    </Modal>
  );
};

export default UserForm;