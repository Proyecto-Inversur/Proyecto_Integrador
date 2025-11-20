import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown, Card } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { createSucursal, updateSucursal } from '../../services/sucursalService';
import { getZonas, createZona, deleteZona } from '../../services/zonaService';
import DireccionAutocomplete from '../DireccionAutocomplete';
import '../../styles/formularios.css';

const emptyDireccion = { address: '', lat: '', lng: '' };
const frecuenciaOptions = [
  { value: '', label: 'Sin preventivo' },
  { value: 'Mensual', label: 'Mensual' },
  { value: 'Trimestral', label: 'Trimestral' },
  { value: 'Cuatrimestral', label: 'Cuatrimestral' },
  { value: 'Semestral', label: 'Semestral' },
];

const normalizeDireccion = (direccion) => {
  if (!direccion) return { ...emptyDireccion };
  if (typeof direccion === 'string') {
    return { ...emptyDireccion, address: direccion };
  }
  return {
    address: direccion.address || '',
    lat: direccion.lat || '',
    lng: direccion.lng || '',
  };
};

const SucursalForm = ({
  sucursal,
  clienteId,
  inline = false,
  onClose,
  onSaved,
  title,
  setError,
  setSuccess
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    zona: '',
    direccion: { ...emptyDireccion },
    superficie: '',
    frecuencia_preventivo: '',
  });
  const [zonas, setZonas] = useState([]);
  const [newZona, setNewZona] = useState('');
  const [showNewZonaInput, setShowNewZonaInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchZonas = async () => {
      setIsLoading(true);
      try {
        const response = await getZonas();
        setZonas(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar las zonas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchZonas();
  }, []);

  useEffect(() => {
    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || '',
        zona: sucursal.zona || '',
        direccion: normalizeDireccion(sucursal.direccion),
        superficie: sucursal.superficie || '',
        frecuencia_preventivo: sucursal.frecuencia_preventivo || '',
      });
    } else {
      setFormData({
        nombre: '',
        zona: '',
        direccion: { ...emptyDireccion },
        superficie: '',
        frecuencia_preventivo: '',
      });
    }
  }, [sucursal]);

  const toggleDropdown = (isOpen) => {
    setDropdownOpen(isOpen);
  };

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
    if (!newZona.trim()) return;
    setIsLoading(true);
    try {
      const response = await createZona({ nombre: newZona.trim() });
      setZonas([...zonas, response.data]);
      setFormData({ ...formData, zona: newZona });
      setNewZona('');
      setShowNewZonaInput(false);
      setError(null);
      setSuccess('Zona creada correctamente.');
    } catch (err) {
      setError('No se pudo crear la zona. Puede que ya exista.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
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
      setSuccess('Zona eliminada correctamente.');
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar la zona. Puede estar en uso.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!sucursal && !clienteId) {
      setError('Seleccione un cliente antes de crear una sucursal.');
      setIsLoading(false);
      return;
    }

    if (!formData.nombre || !formData.zona) {
      setError('Los campos Nombre y Zona son obligatorios.');
      setIsLoading(false);
      return;
    }

    if (!formData.direccion.lat || !formData.direccion.lng) {
      setError('Debe seleccionar una dirección válida en el mapa.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre,
        zona: formData.zona,
        direccion: {
          address: formData.direccion.address,
          lat: formData.direccion.lat,
          lng: formData.direccion.lng,
        },
        superficie: formData.superficie,
        frecuencia_preventivo: formData.frecuencia_preventivo || null,
      };

      if (sucursal) {
        await updateSucursal(sucursal.id, payload);
      } else {
        await createSucursal(clienteId, payload);
      }

      setError(null);
      setSuccess(sucursal ? 'Sucursal actualizada correctamente.' : 'Sucursal creada correctamente.');
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la sucursal.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const formContent = (
    <>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="sucursalNombre">
          <Form.Label className="required required-asterisk">Nombre</Form.Label>
          <Form.Control
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="sucursalZona">
          <Form.Label className="required required-asterisk">Zona</Form.Label>
          <Dropdown show={dropdownOpen} onToggle={toggleDropdown} ref={dropdownRef}>
            <Dropdown.Toggle id="dropdown-zona" className="custom-dropdown-toggle">
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
                  <span className="custom-dropdown-item-span">{zona.nombre}</span>
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
              <Dropdown.Item onClick={() => handleZonaSelect('new')} className="custom-dropdown-item-add">
                <span className="custom-dropdown-item-add-span">
                  <FaPlus />
                </span>{' '}
                Agregar nueva zona...
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
              <Button className="custom-add-button" onClick={handleNewZonaSubmit} disabled={!newZona.trim()}>
                Agregar
              </Button>
            </InputGroup>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="sucursalDireccion">
          <Form.Label className="required required-asterisk">Dirección</Form.Label>
          <DireccionAutocomplete onSelect={handleDireccionSelect} />
          {formData.direccion.address && (
            <small className="text-muted">Seleccionado: {formData.direccion.address}</small>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="sucursalSuperficie">
          <Form.Label>Superficie</Form.Label>
          <Form.Control
            type="text"
            name="superficie"
            value={formData.superficie}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="sucursalFrecuencia">
          <Form.Label>Frecuencia de preventivo</Form.Label>
          <Form.Select
            name="frecuencia_preventivo"
            value={formData.frecuencia_preventivo}
            onChange={handleChange}
            className="form-select"
          >
            {frecuenciaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          {formData.frecuencia_preventivo
            ? <small className="text-muted">La sucursal tendrá preventivo {formData.frecuencia_preventivo.toLowerCase()}.</small>
            : <small className="text-muted">Si dejas este campo vacío, la sucursal no tendrá preventivo.</small>}
        </Form.Group>

        <div className="d-flex gap-2">
          <Button className="custom-save-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
          {inline && (
            <Button variant="outline-secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
          )}
        </div>
      </Form>
    </>
  );

  if (inline) {
    return (
      <Card className="sucursal-inline-card mb-3">
        <Card.Body>{isLoading ? <div className="text-center">Cargando...</div> : formContent}</Card.Body>
      </Card>
    );
  }

  return (
    <Modal
      show
      onHide={onClose}
      centered
      scrollable
      dialogClassName="suc-modal"
      contentClassName="suc-modal-content"
      bodyClassName="suc-modal-body"
    >
      <Modal.Header closeButton className="suc-modal-header">
        <Modal.Title>{title || (sucursal ? 'Editar Sucursal' : 'Crear Sucursal')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{isLoading ? <div className="text-center">Cargando...</div> : formContent}</Modal.Body>
    </Modal>
  );
};

export default SucursalForm;
