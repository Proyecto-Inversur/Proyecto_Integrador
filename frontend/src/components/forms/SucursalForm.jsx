import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { createSucursal, updateSucursal } from '../../services/sucursalService';
import { getZonas, createZona, deleteZona } from '../../services/zonaService';
import { FaPlus } from 'react-icons/fa';
import DireccionAutocomplete from '../DireccionAutocomplete';
import '../../styles/formularios.css';

const SucursalForm = ({ sucursal, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    zona: '',
    direccion: { address: '', lat: '', lng: '' },
    superficie: '',
  });
  const [zonas, setZonas] = useState([]);
  const [newZona, setNewZona] = useState('');
  const [showNewZonaInput, setShowNewZonaInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

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

    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || '',
        zona: sucursal.zona || '',
        direccion: sucursal.direccion || { address: '', lat: '', lng: '' },
        superficie: sucursal.superficie || '',
      });
    }
  }, [sucursal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDireccionSelect = ({ address, lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      direccion: { address, lat, lng },
    }));
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
        setFormData({ ...formData, zona: '' });
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
    e.preventDefault();
    setIsLoading(true);
    if (!formData.direccion.lat || !formData.direccion.lng) {
      setError('Debe proporcionar coordenadas válidas.');
      setIsLoading(false);
      return;
    }
    try {
      const submitData = {
        ...formData,
        direccion: {
          address: formData.direccion.address,
          lat: formData.direccion.lat,
          lng: formData.direccion.lng,
        },
      };
      if (sucursal) {
        await updateSucursal(sucursal.id, submitData);
      } else {
        await createSucursal(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving sucursal:', error);
      setError('Error al guardar la sucursal.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{sucursal ? 'Editar Sucursal' : 'Crear Sucursal'}</Modal.Title>
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
                    value={formData.nombre || ''}
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
                <Form.Group className="mb-3" controlId="direccion">
                  <Form.Label className="required required-asterisk">Dirección</Form.Label>
                  <DireccionAutocomplete onSelect={handleDireccionSelect} />
                  {formData.direccion.address && (
                    <small className="text-muted">Seleccionado: {formData.direccion.address}</small>
                  )}
                </Form.Group>
                <Form.Group className="mb-3" controlId="superficie">
                  <Form.Label>Superficie</Form.Label>
                  <Form.Control
                    type="text"
                    name="superficie"
                    value={formData.superficie || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button className="custom-save-button" type="submit">
                  Guardar
                </Button>
              </Form>
            </div>
          )}
        </Modal.Body>
    </Modal>
  );
};

export default SucursalForm;