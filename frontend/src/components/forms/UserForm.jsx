import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createUser, updateUser } from '../../services/userService';
import { AuthContext } from '../../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/formularios.css';

const UserForm = ({ 
  user, 
  onClose,
  setError,
  setSuccess
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rol: 'Administrador',
  });
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
        const { idToken, email } = await signInWithGoogle(false);
        const payload = { ...formData, email: email, id_token: idToken };
        await createUser(payload);
      }
      setError(null);
      setSuccess(user ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message || 'Error al guardar el usuario.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const isFormValid = () => {
    return formData.nombre.trim() && formData.rol;
  };

  return (
    <Modal
      show
      onHide={onClose}
      centered
      scrollable
      dialogClassName="user-modal"
      contentClassName="user-modal-content"
      bodyClassName="user-modal-body"
    >
      <Modal.Header closeButton className="user-modal-header">
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
                  className="custom-save-button"
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