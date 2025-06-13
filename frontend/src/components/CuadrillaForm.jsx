import React from 'react';
import { useState, useEffect, useRef, useContext } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown, Alert } from 'react-bootstrap';
import { createCuadrilla, updateCuadrilla } from '../services/cuadrillaService';
import { getZonas, createZona, deleteZona } from '../services/zonaService';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaPlus } from 'react-icons/fa';
import '../styles/formularios.css';

const CuadrillaForm = ({ cuadrilla, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    zona: '',
  });
  const [zonas, setZonas] = useState([]);
  const [newZona, setNewZona] = useState('');
  const [showNewZonaInput, setShowNewZonaInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const { signInWithGoogleForRegistration } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchZonas = async () => {
      setIsLoading(true);
      try {
        const response = await getZonas();
        setZonas(response.data);
      } catch (error) {
        console.error('Error fetching zonas:', error);
        setError('Error al cargar las zonas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchZonas();

    if (cuadrilla) {
      setFormData({
        nombre: cuadrilla.nombre || null,
        zona: cuadrilla.zona || null,
      });
    }
  }, [cuadrilla]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleZonaSelect = (zonaNombre) => {
    if (zonaNombre === 'new') {
      setShowNewZonaInput(true);
      setFormData({ ...formData, zona: '' });
    } else {
      setShowNewZonaInput(false);
      setFormData({ ...formData, zona: zonaNombre });
    }
    setDropdownOpen(false);
  };

  const handleNewZonaSubmit = async () => {
    setIsLoading(true);
    if (newZona.trim()) {
      try {
        const response = await createZona({ nombre: newZona });
        setZonas([...zonas, response.data]);
        setFormData({ ...formData, zona: newZona });
        setNewZona('');
        setShowNewZonaInput(false);
        setError(null);
      } catch (error) {
        console.error('Error creating zona:', error);
        setError('Error al crear la zona. Puede que ya exista.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteZona = async (id) => {
    setIsLoading(true);
    try {
      await deleteZona(id);
      setZonas(zonas.filter((zona) => zona.id !== id));
      if (formData.zona === zonas.find((z) => z.id === id)?.nombre) {
        setFormData({ ...formData, zona: null });
      }
      setError(null);
    } catch (error) {
      console.error('Error deleting zona:', error);
      const errorMessage = error.response?.data?.detail || 'No se pudo eliminar la zona. Puede estar en uso.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      if (cuadrilla) {
        await updateCuadrilla(cuadrilla.id, formData);
      } else {
        const { idToken, email } = await signInWithGoogleForRegistration();
        const payload = { ...formData, email: email, id_token: idToken };
        await createCuadrilla(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error saving cuadrilla:', error);
      setError(error.message || 'Error al guardar la cuadrilla.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.nombre.trim() && formData.zona.trim();
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{cuadrilla ? 'Editar Cuadrilla' : 'Crear Cuadrilla'}</Modal.Title>
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
                <Form.Group className="mb-3" controlId="zona">
                  <Form.Label className="required required-asterisk">Zona</Form.Label>
                  <Dropdown show={dropdownOpen} onToggle={toggleDropdown} ref={dropdownRef}>
                    <Dropdown.Toggle
                      id="dropdown-zona"
                      className="custom-dropdown-toggle"
                    >
                      {formData.zona || 'Seleccione una zona'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {zonas.map((zona) => (
                        <Dropdown.Item
                          key={zona.id}
                          as="div"
                          className="custom-dropdown-item"
                          onClick={() => handleZonaSelect(zona.nombre)}
                        >
                          <span
                            className="custom-dropdown-item-span"
                          >
                            {zona.nombre}
                          </span>
                          <Button
                            size="sm"
                            className="custom-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteZona(zona.id);
                            }}
                          >
                            ×
                          </Button>
                        </Dropdown.Item>
                      ))}
                      <Dropdown.Item
                        onClick={() => handleZonaSelect('new')}
                        className="custom-dropdown-item-add"
                      >
                        <span className="custom-dropdown-item-add-span"><FaPlus /></span> Agregar nueva zona...
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  {showNewZonaInput && (
                    <InputGroup className="mt-2">
                      <Form.Control
                        type="text"
                        value={newZona}
                        onChange={(e) => setNewZona(e.target.value)}
                        placeholder="Escriba la nueva zona"
                      />
                      <Button
                        className="custom-add-button"
                        onClick={handleNewZonaSubmit}
                        disabled={!newZona.trim()}
                      >
                        Agregar
                      </Button>
                    </InputGroup>
                  )}
                </Form.Group>
                <Button
                  className="custom-save-button d-flex align-items-center justify-content-center gap-2"
                  type="submit"
                  disabled={!isFormValid()}
                >
                  <FcGoogle size={20} />
                  {cuadrilla ? 'Guardar' : 'Registrar con Google'}
                </Button>
              </Form>
            </div>
          )}
        </Modal.Body>
    </Modal>
  );
};

export default CuadrillaForm;