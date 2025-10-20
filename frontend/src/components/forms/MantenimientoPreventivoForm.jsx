import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { createMantenimientoPreventivo, updateMantenimientoPreventivo } from '../../services/mantenimientoPreventivoService';
import { getPreventivos, createPreventivo, deletePreventivo, updatePreventivo } from '../../services/preventivoService';
import { getCuadrillas } from '../../services/cuadrillaService';
import { getSucursales } from '../../services/sucursalService';
import { FaPlus, FaPencilAlt } from 'react-icons/fa';
import '../../styles/formularios.css';

const MantenimientoPreventivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    id_sucursal: '',
    frecuencia: '',
    id_cuadrilla: '',
    fecha_apertura: '',
    estado: 'Pendiente',
  });
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [newPreventivo, setNewPreventivo] = useState({
    id: '',
    id_sucursal: '',
    nombre_sucursal: '',
    frecuencia: '',
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
        id_sucursal: mantenimiento.id_sucursal || '',
        frecuencia: mantenimiento.frecuencia || '',
        id_cuadrilla: mantenimiento.id_cuadrilla || '',
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || '',
        estado: mantenimiento.estado || 'Pendiente',
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
        id_sucursal: value ? parseInt(value) : '',
        nombre_sucursal: sucursal ? sucursal.nombre : '',
      });
    } else {
      setNewPreventivo({ ...newPreventivo, [name]: value });
    }
  };

  const handlePreventivoSelect = (preventivoId) => {
    if (preventivoId === 'new') {
      setShowNewPreventivoInput(true);
      setIsEditing(false);
      setNewPreventivo({ id: '', id_sucursal: '', nombre_sucursal: '', frecuencia: '' });
      setFormData({ ...formData, id_sucursal: '', frecuencia: '' });
    } else {
      setShowNewPreventivoInput(false);
      setIsEditing(false);
      const preventivo = preventivos.find(p => p.id === parseInt(preventivoId));
      setFormData({
        ...formData,
        id_sucursal: preventivo ? preventivo.id_sucursal : null,
        frecuencia: preventivo ? preventivo.frecuencia : null,
      });
    }
    setDropdownOpen(false);
  };

  const handleEditPreventivo = (preventivo, e) => {
    e.stopPropagation();
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
      id_sucursal: preventivo.id_sucursal,
      frecuencia: preventivo.frecuencia,
    });
    setDropdownOpen(false);
  };

  const handleNewPreventivoSubmit = async () => {
    setIsLoading(true);
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
        id_sucursal: response.data.id_sucursal,
        frecuencia: response.data.frecuencia,
      });
      setNewPreventivo({ id: '', id_sucursal: '', nombre_sucursal: '', frecuencia: '' });
      setShowNewPreventivoInput(false);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} preventivo:`, error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.detail || `Error al ${isEditing ? 'actualizar' : 'crear'} el preventivo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreventivo = async (id, e) => {
    setIsLoading(true);
    e.stopPropagation();
    try {
      await deletePreventivo(id);
      setPreventivos(preventivos.filter((preventivo) => preventivo.id !== id));
      if (formData.id_sucursal === preventivos.find(p => p.id === id)?.id_sucursal &&
          formData.frecuencia === preventivos.find(p => p.id === id)?.frecuencia) {
        setFormData({ ...formData, id_sucursal: '', frecuencia: '' });
      }
      setError(null);
    } catch (error) {
      console.error('Error deleting preventivo:', error);
      const errorMessage = error.response?.data?.detail || 'No se pudo eliminar el preventivo. Puede estar en uso.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      if (!formData.id_sucursal || !formData.frecuencia || !formData.id_cuadrilla || !formData.fecha_apertura) {
        setError('Por favor, completa todos los campos obligatorios.');
        return;
      }

      const payload = {
        id_sucursal: parseInt(formData.id_sucursal),
        frecuencia: formData.frecuencia,
        id_cuadrilla: parseInt(formData.id_cuadrilla),
        fecha_apertura: formData.fecha_apertura,
        estado: formData.estado,
      };

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
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.id_sucursal && formData.frecuencia && formData.id_cuadrilla && formData.fecha_apertura;
  };

  const getPreventivoDisplay = (id) => {
    const preventivo = preventivos.find((p) => p.id_sucursal === parseInt(id));
    if (!preventivo) return 'Seleccione un preventivo';
    return `${preventivo.nombre_sucursal} - ${preventivo.frecuencia}`;
  };

  return (
    <Modal
      show
      onHide={onClose}
      centered
      scrollable
      dialogClassName="mc-modal"
      contentClassName="mc-modal-content"
      bodyClassName="mc-modal-body"
    >
      <Modal.Header closeButton className="mc-modal-header">
        <Modal.Title>
          {mantenimiento ? 'Editar Mantenimiento Preventivo' : 'Crear Mantenimiento Preventivo'}
        </Modal.Title>
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
                      {getPreventivoDisplay(formData.id_sucursal)}
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
                            {getPreventivoDisplay(preventivo.id_sucursal)}
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
                        aria-label="Sucursal"
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
                        aria-label="Frecuencia"
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
            </div>
          )}
        </Modal.Body>
    </Modal>
  );
};

export default MantenimientoPreventivoForm;