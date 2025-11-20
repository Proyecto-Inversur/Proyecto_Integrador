import { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import {
  createMantenimientoPreventivo,
  updateMantenimientoPreventivo,
  getMantenimientosPreventivos,
} from '../../services/mantenimientoPreventivoService';
import { getClientes } from '../../services/clienteService';
import { getSucursalesByCliente } from '../../services/sucursalService';
import { getCuadrillas } from '../../services/cuadrillaService';
import '../../styles/formularios.css';

const MantenimientoPreventivoForm = ({ 
  mantenimiento, 
  onClose,
  setError,
  setSuccess
}) => {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [sucursalesPorCliente, setSucursalesPorCliente] = useState({});
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    id_sucursal: '',
    id_cuadrilla: '',
    fecha_apertura: '',
    estado: 'Pendiente',
  });
  const [frecuenciaSucursal, setFrecuenciaSucursal] = useState(null);
  const [error_form, setError_form] = useState(null);
  const [preventivosExistentes, setPreventivosExistentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSucursalesForCliente = async (id) => {
    if (!id) return [];
    if (sucursalesPorCliente[id]) return sucursalesPorCliente[id];
    const response = await getSucursalesByCliente(id);
    const data = response.data || [];
    setSucursalesPorCliente((prev) => ({ ...prev, [id]: data }));
    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const preventivosPromise =
          typeof getMantenimientosPreventivos === 'function'
            ? getMantenimientosPreventivos()
            : Promise.resolve({ data: [] });
        const [clientesResponse, cuadrillasResponse, preventivosResponse] = await Promise.all([
          getClientes(),
          getCuadrillas(),
          preventivosPromise,
        ]);
        const clientesData = clientesResponse.data || [];
        setClientes(clientesData);
        setCuadrillas(cuadrillasResponse.data || []);
        setPreventivosExistentes(preventivosResponse.data || []);

        let initialClienteId = mantenimiento?.cliente_id || mantenimiento?.id_cliente;
        if (!initialClienteId && clientesData.length) {
          initialClienteId = clientesData[0].id;
        }
        if (initialClienteId) {
          setClienteId(String(initialClienteId));
          await fetchSucursalesForCliente(initialClienteId);
        }

        if (mantenimiento) {
          setFormData({
            id_sucursal: mantenimiento.id_sucursal || '',
            id_cuadrilla: mantenimiento.id_cuadrilla || '',
            fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || '',
            estado: mantenimiento.estado || 'Pendiente',
          });
          setFrecuenciaSucursal(mantenimiento.frecuencia || mantenimiento.frecuencia_preventivo || null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [mantenimiento]);

  useEffect(() => {
    if (mantenimiento) {
      setFormData({
        id_sucursal: mantenimiento.id_sucursal || '',
        id_cuadrilla: mantenimiento.id_cuadrilla || '',
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || '',
        estado: mantenimiento.estado || 'Pendiente',
      });
      setFrecuenciaSucursal(mantenimiento.frecuencia || mantenimiento.frecuencia_preventivo || null);
      if (mantenimiento.cliente_id || mantenimiento.id_cliente) {
        setClienteId(String(mantenimiento.cliente_id || mantenimiento.id_cliente));
      }
    }
  }, [mantenimiento]);

  useEffect(() => {
    if (!clienteId || !formData.id_sucursal) {
      return;
    }
    const sucursales = sucursalesPorCliente[clienteId] || [];
    const selected = sucursales.find((s) => String(s.id) === String(formData.id_sucursal));
    if (selected) {
      setFrecuenciaSucursal(selected.frecuencia_preventivo || null);
    }
  }, [clienteId, formData.id_sucursal, sucursalesPorCliente]);

  const sucursales = clienteId ? sucursalesPorCliente[clienteId] || [] : [];
  const preventivoNoConfigurable = !frecuenciaSucursal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = async (e) => {
    const value = e.target.value;
    setClienteId(value);
    setFormData((prev) => ({ ...prev, id_sucursal: '' }));
    await fetchSucursalesForCliente(value);
  };

  const handleSucursalChange = (e) => {
    setFormData((prev) => ({ ...prev, id_sucursal: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setError_form(null);

    if (!clienteId || !formData.id_sucursal || !formData.id_cuadrilla || !formData.fecha_apertura) {
      setError_form('Completá todos los campos obligatorios.');
      setIsLoading(false);
      return;
    }

    const getVentanaFrecuencia = (fechaISO, frecuencia) => {
      const targetDate = new Date(fechaISO);
      if (Number.isNaN(targetDate.getTime()) || !frecuencia) return null;
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const normalize = frecuencia.toLowerCase();
      let startMonth = month;
      let endMonth = month;

      if (normalize === 'trimestral') {
        startMonth = Math.floor(month / 3) * 3;
        endMonth = startMonth + 2;
      } else if (normalize === 'cuatrimestral') {
        startMonth = Math.floor(month / 4) * 4;
        endMonth = startMonth + 3;
      } else if (normalize === 'semestral') {
        startMonth = Math.floor(month / 6) * 6;
        endMonth = startMonth + 5;
      }

      const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
      const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
      return { start, end };
    };

    const ventana = getVentanaFrecuencia(formData.fecha_apertura, frecuenciaSucursal);
    if (ventana) {
      const conflicto = preventivosExistentes.some((prev) => {
        if (Number(prev.id_sucursal) !== parseInt(formData.id_sucursal, 10)) return false;
        if (mantenimiento && Number(prev.id) === Number(mantenimiento.id)) return false;
        if ((prev.frecuencia || '').toLowerCase() !== (frecuenciaSucursal || '').toLowerCase()) return false;
        const fechaPrev = new Date(prev.fecha_apertura);
        if (Number.isNaN(fechaPrev.getTime())) return false;
        return fechaPrev >= ventana.start && fechaPrev <= ventana.end;
      });
      if (conflicto) {
        setError_form('Ya existe un preventivo en ese rango de frecuencia para la sucursal seleccionada.');
        setIsLoading(false);
        return;
      }
    }

    if (preventivoNoConfigurable) {
      setError_form('Esta sucursal no tiene frecuencia configurada y no se puede crear el preventivo.');
      setIsLoading(false);
      return;
    }

    const payload = {
      cliente_id: parseInt(clienteId, 10),
      id_sucursal: parseInt(formData.id_sucursal, 10),
      id_cuadrilla: parseInt(formData.id_cuadrilla, 10),
      frecuencia: frecuenciaSucursal,
      fecha_apertura: formData.fecha_apertura,
      estado: formData.estado,
    };

    try {
      if (mantenimiento) {
        await updateMantenimientoPreventivo(mantenimiento.id, payload);
      } else {
        await createMantenimientoPreventivo(payload);
      }
      setError(null);
      setSuccess(mantenimiento ? 'Mantenimiento preventivo actualizado correctamente.' : 'Mantenimiento preventivo creado correctamente.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el mantenimiento preventivo.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const isFormValid =
    clienteId &&
    formData.id_sucursal &&
    formData.id_cuadrilla &&
    formData.fecha_apertura &&
    !preventivoNoConfigurable;

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
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Preventivo' : 'Crear Mantenimiento Preventivo'}</Modal.Title>
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
            {error_form && <Alert variant="danger">{error_form}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="cliente">
                <Form.Label className="required required-asterisk">Cliente</Form.Label>
                <Form.Select
                  name="cliente"
                  value={clienteId}
                  onChange={handleClienteChange}
                  required
                  className="form-select"
                >
                  <option value="">Seleccioná un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="sucursal">
                <Form.Label className="required required-asterisk">Sucursal</Form.Label>
                <Form.Select
                  name="id_sucursal"
                  value={formData.id_sucursal}
                  onChange={handleSucursalChange}
                  required
                  className="form-select"
                  disabled={!clienteId || sucursales.length === 0}
                >
                  <option value="">
                    {clienteId ? 'Seleccioná una sucursal' : 'Seleccioná primero un cliente'}
                  </option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </Form.Select>
                {clienteId && (
                  <div className="mt-2 text-muted d-flex align-items-center gap-2">
                    <FaInfoCircle />
                    {frecuenciaSucursal ? (
                      <span>Frecuencia preventiva de la sucursal: {frecuenciaSucursal}</span>
                    ) : (
                      <span className="text-danger">
                        Esta sucursal no tiene mantenimiento preventivo configurado.
                      </span>
                    )}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="cuadrilla">
                <Form.Label className="required required-asterisk">Cuadrilla</Form.Label>
                <Form.Select
                  name="id_cuadrilla"
                  value={formData.id_cuadrilla}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Seleccioná una cuadrilla</option>
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
                  value={formData.fecha_apertura}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="estado">
                <Form.Label className="required required-asterisk">Estado</Form.Label>
                <Form.Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Finalizado">Finalizado</option>
                </Form.Select>
              </Form.Group>

              <Button className="custom-save-button" type="submit" disabled={!isFormValid || isLoading}>
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
