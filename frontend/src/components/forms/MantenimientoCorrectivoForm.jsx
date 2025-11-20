import React from 'react';
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createMantenimientoCorrectivo, updateMantenimientoCorrectivo } from '../../services/mantenimientoCorrectivoService';
import { getSucursalesByCliente } from '../../services/sucursalService';
import { getCuadrillas } from '../../services/cuadrillaService';
import { getClientes } from '../../services/clienteService';
import '../../styles/formularios.css';

const MantenimientoCorrectivoForm = ({ 
  mantenimiento, 
  onClose,
  setError,
  setSuccess
}) => {
  const [formData, setFormData] = useState({
    id_sucursal: '',
    id_cuadrilla: '',
    fecha_apertura: '',
    numero_caso: '',
    incidente: '',
    rubro: '',
    estado: 'Pendiente',
    prioridad: 'Media',
  });
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [sucursalesPorCliente, setSucursalesPorCliente] = useState({});
  const [cuadrillas, setCuadrillas] = useState([]);
  const [error_form, setError_form] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientesResponse, cuadrillasResponse] = await Promise.all([
          getClientes(),
          getCuadrillas(),
        ]);
        const clientesData = clientesResponse.data || [];
        setClientes(clientesData);
        setCuadrillas(cuadrillasResponse.data || []);

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
            numero_caso: mantenimiento.numero_caso || '',
            incidente: mantenimiento.incidente || '',
            rubro: mantenimiento.rubro || '',
            estado: mantenimiento.estado || 'Pendiente',
            prioridad: mantenimiento.prioridad || 'Media',
          });
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [mantenimiento]);

  const fetchSucursalesForCliente = async (id) => {
    if (!id) return [];
    if (sucursalesPorCliente[id]) return sucursalesPorCliente[id];
    const response = await getSucursalesByCliente(id);
    const data = response.data || [];
    setSucursalesPorCliente((prev) => ({ ...prev, [id]: data }));
    return data;
  };

  const sucursales = clienteId ? sucursalesPorCliente[clienteId] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      if (
        !clienteId ||
        !formData.id_sucursal ||
        !formData.fecha_apertura ||
        !formData.numero_caso ||
        !formData.incidente ||
        !formData.rubro ||
        !formData.estado ||
        !formData.prioridad
      ) {
        setError_form('Por favor, completa todos los campos obligatorios.');
        return;
      }

      const payload = {
        ...formData,
        cliente_id: parseInt(clienteId, 10),
        id_sucursal: formData.id_sucursal,
      };

      if (mantenimiento) {
        await updateMantenimientoCorrectivo(mantenimiento.id, payload);
      } else {
        await createMantenimientoCorrectivo(payload);
      }
      setError(null);
      setSuccess(mantenimiento ? 'Mantenimiento correctivo actualizado correctamente.' : 'Mantenimiento correctivo creado correctamente.');
    } catch (error) {
      setError(error.message || 'Error al guardar el mantenimiento correctivo.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const isFormValid = () => {
    return (
      clienteId &&
      formData.id_sucursal &&
      formData.fecha_apertura &&
      formData.numero_caso &&
      formData.incidente &&
      formData.rubro &&
      formData.estado &&
      formData.prioridad
    );
  };

  const handleClienteChange = async (e) => {
    const value = e.target.value;
    setClienteId(value);
    setFormData((prev) => ({ ...prev, id_sucursal: '' }));
    await fetchSucursalesForCliente(value);
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
          {mantenimiento ? 'Editar Mantenimiento Correctivo' : 'Crear Mantenimiento Correctivo'}
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
              {error_form && <Alert variant="danger">{error_form}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="cliente_id">
                  <Form.Label className="required required-asterisk">Cliente</Form.Label>
                  <Form.Select
                    name="cliente_id"
                    value={clienteId}
                    onChange={handleClienteChange}
                    required
                    className='form-select'
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="id_sucursal">
                  <Form.Label className="required required-asterisk">Sucursal</Form.Label>
                  <Form.Select
                    name="id_sucursal"
                    value={formData.id_sucursal}
                    onChange={handleChange}
                    required
                    className='form-select'
                    disabled={!clienteId || sucursales.length === 0}
                  >
                    <option value="">{clienteId ? 'Seleccione una sucursal' : 'Seleccione un cliente primero'}</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="id_cuadrilla">
                  <Form.Label className="required required-asterisk">Cuadrilla</Form.Label>
                  <Form.Select
                    name="id_cuadrilla"
                    value={formData.id_cuadrilla}
                    onChange={handleChange}
                    required
                    className='form-select'
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
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="numero_caso">
                  <Form.Label className="required required-asterisk">Número de Caso</Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_caso"
                    value={formData.numero_caso || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="incidente">
                  <Form.Label className="required required-asterisk">Incidente</Form.Label>
                  <Form.Control
                    type="text"
                    name="incidente"
                    value={formData.incidente || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="rubro">
                  <Form.Label className="required required-asterisk">Rubro</Form.Label>
                  <Form.Select
                    name="rubro"
                    value={formData.rubro || ''}
                    onChange={handleChange}
                    required
                    className='form-select'
                  >
                    <option value="">Seleccione un rubro</option>
                    <option value="Iluminación/Electricidad">Iluminación/Electricidad</option>
                    <option value="Refrigeración">Refrigeración</option>
                    <option value="Aberturas/Vidrios">Aberturas/Vidrios</option>
                    <option value="Pintura/Impermeabilizaciones">Pintura/Impermeabilizaciones</option>
                    <option value="Pisos">Pisos</option>
                    <option value="Techos">Techos</option>
                    <option value="Sanitarios">Sanitarios</option>
                    <option value="Cerrajeria">Cerrajeria</option>
                    <option value="Mobiliario">Mobiliario</option>
                    <option value="Senalectica">Senalectica</option>
                    <option value="Otros">Otros</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="estado">
                  <Form.Label className="required required-asterisk">Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado || ''}
                    onChange={handleChange}
                    required
                    className='form-select'
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="A Presupuestar">A Presupuestar</option>
                    <option value="Presupuestado">Presupuestado</option>
                    <option value="Presupuesto Aprobado">Presupuesto Aprobado</option>
                    <option value="Esperando Respuesta Bancor">Esperando Respuesta Bancor</option>
                    <option value="Aplazado">Aplazado</option>
                    <option value="Desestimado">Desestimado</option>
                    <option value="Solucionado">Solucionado</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="prioridad">
                  <Form.Label className="required required-asterisk">Prioridad</Form.Label>
                  <Form.Select
                    name="prioridad"
                    value={formData.prioridad || ''}
                    onChange={handleChange}
                    required
                    className='form-select'
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </Form.Select>
                </Form.Group>
                <Button className="custom-save-button" type="submit" disabled={!isFormValid()}>
                  Guardar
                </Button>
              </Form>
            </div>
          )}
        </Modal.Body>
    </Modal>
  );
};

export default MantenimientoCorrectivoForm;
