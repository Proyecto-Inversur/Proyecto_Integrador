  import React from 'react';
  import { useState, useEffect, useRef } from 'react';
  import { Modal, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
  import { createSucursal, updateSucursal } from '../services/sucursalService';
  import { getZonas, createZona, deleteZona } from '../services/zonaService';
  import { FaPlus } from 'react-icons/fa';
  import '../styles/formularios.css';

  const SucursalForm = ({ sucursal, onClose }) => {
    const [formData, setFormData] = useState({
      nombre: null,
      zona: null,
      direccion: null,
      superficie: null,
    });
    const [zonas, setZonas] = useState([]);
    const [newZona, setNewZona] = useState('');
    const [showNewZonaInput, setShowNewZonaInput] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const fetchZonas = async () => {
        try {
          const response = await getZonas();
          console.log('Zonas cargadas:', response.data); // Debug: inspeccionar datos
          setZonas(response.data);
        } catch (error) {
          console.error('Error fetching zonas:', error);
          setError('Error al cargar las zonas.');
        }
      };
      fetchZonas();

      if (sucursal) {
        setFormData({
          nombre: sucursal.nombre || null,
          zona: sucursal.zona || null,
          direccion: sucursal.direccion || null,
          superficie: sucursal.superficie || null,
        });
      }
    }, [sucursal]);

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleZonaSelect = (zonaNombre) => {
      if (zonaNombre === 'new') {
        setShowNewZonaInput(true);
        setFormData({ ...formData, zona: null });
      } else {
        setShowNewZonaInput(false);
        setFormData({ ...formData, zona: zonaNombre });
      }
      setDropdownOpen(false);
    };

    const handleNewZonaSubmit = async () => {
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
        }
      }
    };

    const handleDeleteZona = async (id) => {
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
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (sucursal) {
          await updateSucursal(sucursal.id, formData);
        } else {
          await createSucursal(formData);
        }
        onClose();
      } catch (error) {
        console.error('Error saving sucursal:', error);
        setError('Error al guardar la sucursal.');
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
              <Form.Control
                type="text"
                name="direccion"
                value={formData.direccion || ''}
                onChange={handleChange}
                required
              />
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
        </Modal.Body>
      </Modal>
    );
  };

  export default SucursalForm;