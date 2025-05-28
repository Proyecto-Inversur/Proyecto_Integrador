import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { createMantenimientoPreventivo, updateMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getPreventivos, createPreventivo, deletePreventivo, updatePreventivo } from '../services/preventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { FaPlus, FaPencilAlt } from 'react-icons/fa';
import '../styles/formularios.css';

const MantenimientoPreventivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    nombre_sucursal: null,
    frecuencia: null,
    id_cuadrilla: null,
    fecha_apertura: null,
  });
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [newPreventivo, setNewPreventivo] = useState({
    id: null,
    id_sucursal: null,
    nombre_sucursal: null,
    frecuencia: null,
  });
  const [showNewPreventivoInput, setShowNewPreventivoInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [preventivosResponse, cuadrillasResponse, sucursalesResponse] = await Promise.all([
          getPreventivos(),
          getCuadrillas(),
          getSucursales(),
        ]);
        console.log('Fetched sucursales:', sucursalesResponse.data);
        setPreventivos(preventivosResponse.data || []);
        setCuadrillas(cuadrillasResponse.data || []);
        setSucursales(sucursalesResponse.data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    if (mantenimiento) {
      setFormData({
        nombre_sucursal: mantenimiento.nombre_sucursal || null,
        frecuencia: mantenimiento.frecuencia || null,
        id_cuadrilla: mantenimiento.id_cuadrilla || null,
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || null,
      });
    }
  }, [mantenimiento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNewPreventivoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'id_sucursal') {
      const sucursal = sucursales.find(s => s.id === parseInt(value));
      setNewPreventivo({
        ...newPreventivo,
        id_sucursal: value ? parseInt(value) : null,
        nombre_sucursal: sucursal ? sucursal.nombre : null,
      });
    } else {
      setNewPreventivo({ ...newPreventivo, [name]: value });
    }
  };

  const handlePreventivoSelect = (preventivoId) => {
    if (preventivoId === 'new') {
      setShowNewPreventivoInput(true);
      setIsEditing(false);
      setNewPreventivo({ id: null, id_sucursal: null, nombre_sucursal: null, frecuencia: null });
      setFormData({ ...formData, nombre_sucursal: null, frecuencia: null });
    } else {
      setShowNewPreventivoInput(false);
      setIsEditing(false);
      const preventivo = preventivos.find(p => p.id === parseInt(preventivoId));
      setFormData({
        ...formData,
        nombre_sucursal: preventivo ? preventivo.nombre_sucursal : null,
        frecuencia: preventivo ? preventivo.frecuencia : null,
      });
    }
    setDropdownOpen(false);
  };

  const handleEditPreventivo = (preventivo, e) => {
    e.stopPropagation();
    console.log('Editing preventivo:', preventivo);
    setShowNewPreventivoInput(true);
    setIsEditing(true);
    setNewPreventivo({
      id: preventivo.id,
      id_sucursal: preventivo.id_sucursal,
      nombre_sucursal: preventivo.nombre_sucursal,
      frecuencia: preventivo.frecuencia || '',
    });
    setFormData({
      ...formData,
      nombre_sucursal: preventivo.nombre_sucursal,
      frecuencia: preventivo.frecuencia,
    });
    setDropdownOpen(false);
  };

  const handleNewPreventivoSubmit = async () => {
    if (!newPreventivo.id_sucursal || !newPreventivo.frecuencia || !newPreventivo.nombre_sucursal) {
      setError('Por favor, selecciona una sucursal y frecuencia.');
      return;
    }

    try {
      const payload = {
        id_sucursal: newPreventivo.id_sucursal,
        nombre_sucursal: newPreventivo.nombre_sucursal,
        frecuencia: newPreventivo.frecuencia,
      };
      console.log('Payload for preventivo:', isEditing ? 'update' : 'create', payload);
      let response;
      if (isEditing) {
        response = await updatePreventivo(newPreventivo.id, payload);
        setPreventivos(preventivos.map(p => p.id === newPreventivo.id ? response.data : p));
      } else {
        response = await createPreventivo(payload);
        setPreventivos([...preventivos, response.data]);
      }
      setFormData({
        ...formData,
        nombre_sucursal: response.data.nombre_sucursal,
        frecuencia: response.data.frecuencia,
      });
      setNewPreventivo({ id: null, id_sucursal: null, nombre_sucursal: null, frecuencia: null });
      setShowNewPreventivoInput(false);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} preventivo:`, error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.detail || `Error al ${isEditing ? 'actualizar' : 'crear'} el preventivo.`);
    }
  };

  const handleDeletePreventivo = async (id, e) => {
    e.stopPropagation();
    try {
      await deletePreventivo(id);
      setPreventivos(preventivos.filter((preventivo) => preventivo.id !== id));
      if (formData.nombre_sucursal === preventivos.find(p => p.id === id)?.nombre_sucursal &&
          formData.frecuencia === preventivos.find(p => p.id === id)?.frecuencia) {
        setFormData({ ...formData, nombre_sucursal: null, frecuencia: null });
      }
      setError(null);
    } catch (error) {
      console.error('Error deleting preventivo:', error);
      const errorMessage = error.response?.data?.detail || 'No se pudo eliminar el preventivo. Puede estar en uso.';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre_sucursal || !formData.frecuencia || !formData.id_cuadrilla || !formData.fecha_apertura) {
        setError('Por favor, completa todos los campos obligatorios.');
        return;
      }

      const payload = {
        nombre_sucursal: formData.nombre_sucursal,
        frecuencia: formData.frecuencia,
        id_cuadrilla: parseInt(formData.id_cuadrilla),
        fecha_apertura: formData.fecha_apertura,
      };
      console.log('Payload for mantenimiento:', payload);

      if (mantenimiento) {
        await updateMantenimientoPreventivo(mantenimiento.id, payload);
      } else {
        await createMantenimientoPreventivo(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mantenimiento preventivo:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.detail || 'Error al guardar el mantenimiento preventivo.');
    }
  };

  const isFormValid = () => {
    return formData.nombre_sucursal && formData.frecuencia && formData.id_cuadrilla && formData.fecha_apertura;
  };

  const getPreventivoDisplay = (id) => {
    const preventivo = preventivos.find((p) => p.id === parseInt(id));
    if (!preventivo) return 'Seleccione un preventivo';
    return `${preventivo.nombre_sucursal || 'Desconocida'} - ${preventivo.frecuencia}`;
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Preventivo' : 'Crear Mantenimiento Preventivo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        {isLoading && <div className="alert alert-info">Cargando datos...</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="id_preventivo">
            <Form.Label className="required required-asterisk">Preventivo</Form.Label>
            <Dropdown show={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} ref={dropdownRef}>
              <Dropdown.Toggle
                id="dropdown-preventivo"
                className="custom-dropdown-toggle w-100"
                disabled={isLoading}
              >
                {formData.nombre_sucursal && formData.frecuencia
                  ? `${formData.nombre_sucursal} - ${formData.frecuencia}`
                  : 'Seleccione un preventivo'}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {preventivos.map((preventivo) => (
                  <Dropdown.Item
                    key={preventivo.id}
                    as="div"
                    className="custom-dropdown-item"
                    onClick={() => handlePreventivoSelect(preventivo.id)}
                  >
                    <span className="custom-dropdown-item-span">
                      {getPreventivoDisplay(preventivo.id)}
                    </span>
                    <Button
                      size="sm"
                      variant="warning"
                      className="custom-edit-button me-1"
                      onClick={(e) => handleEditPreventivo(preventivo, e)}
                      title="Editar"
                    >
                      <FaPencilAlt />
                    </Button>
                    <Button
                      size="sm"
                      className="custom-delete-button"
                      onClick={(e) => handleDeletePreventivo(preventivo.id, e)}
                      title="Eliminar"
                    >
                      ×
                    </Button>
                  </Dropdown.Item>
                ))}
                <Dropdown.Item
                  onClick={() => handlePreventivoSelect('new')}
                  className="custom-dropdown-item-add"
                >
                  <span className="custom-dropdown-item-add-span"><FaPlus /></span> Agregar nuevo preventivo...
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {showNewPreventivoInput && (
              <InputGroup className="mt-2">
                <Form.Select
                  name="id_sucursal"
                  value={newPreventivo.id_sucursal ?? ''}
                  onChange={handleNewPreventivoChange}
                  className="me-2"
                  disabled={isLoading || sucursales.length === 0}
                >
                  <option value="">Seleccione una sucursal</option>
                  {sucursales.length > 0 ? (
                    sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay sucursales disponibles</option>
                  )}
                </Form.Select>
                <Form.Select
                  name="frecuencia"
                  value={newPreventivo.frecuencia || ''}
                  onChange={handleNewPreventivoChange}
                  className="me-2"
                >
                  <option value="">Seleccione una frecuencia</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Cuatrimestral">Cuatrimestral</option>
                  <option value="Semestral">Semestral</option>
                </Form.Select>
                <Button
                  className="custom-add-button"
                  onClick={handleNewPreventivoSubmit}
                  disabled={!newPreventivo.id_sucursal || !newPreventivo.frecuencia || isLoading}
                >
                  {isEditing ? 'Actualizar' : 'Agregar'}
                </Button>
              </InputGroup>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="id_cuadrilla">
            <Form.Label className="required required-asterisk">Cuadrilla</Form.Label>
            <Form.Select
              name="id_cuadrilla"
              value={formData.id_cuadrilla || ''}
              onChange={handleChange}
              required
              className="form-select"
              disabled={isLoading}
            >
              <option value="">Seleccione una cuadrilla</option>
              {cuadrillas.map((cuadrilla) => (
                <option key={cuadrilla.id} value={cuadrilla.id}>
                  {cuadrilla.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="fecha_apertura">
            <Form.Label className="required required-asterisk">Fecha Apertura</Form.Label>
            <Form.Control
              type="date"
              name="fecha_apertura"
              value={formData.fecha_apertura || ''}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </Form.Group>
          <Button
            className="custom-save-button"
            type="submit"
            disabled={!isFormValid() || isLoading}
          >
            Guardar
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MantenimientoPreventivoForm;