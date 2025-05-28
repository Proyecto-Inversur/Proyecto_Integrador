import React from 'react';
import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createMantenimientoCorrectivo, updateMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import '../styles/formularios.css';

const MantenimientoCorrectivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    id_sucursal: null,
    id_cuadrilla: null,
    fecha_apertura: null,
    numero_caso: null,
    incidente: null,
    rubro: null,
    estado: 'Pendiente',
    prioridad: 'Media',
  });
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
          getSucursales(),
          getCuadrillas(),
        ]);
        setSucursales(sucursalesResponse.data);
        setCuadrillas(cuadrillasResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      }
    };
    fetchData();

    if (mantenimiento) {
      setFormData({
        id_sucursal: mantenimiento.id_sucursal || null,
        id_cuadrilla: mantenimiento.id_cuadrilla || null,
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || null,
        numero_caso: mantenimiento.numero_caso || null,
        incidente: mantenimiento.incidente || null,
        rubro: mantenimiento.rubro || null,
        estado: mantenimiento.estado || 'Pendiente',
        prioridad: mantenimiento.prioridad || 'Media',
      });
    }
  }, [mantenimiento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar que los campos obligatorios no estén vacíos
      if (
        !formData.id_sucursal ||
        !formData.fecha_apertura ||
        !formData.numero_caso ||
        !formData.incidente ||
        !formData.rubro ||
        !formData.estado ||
        !formData.prioridad
      ) {
        setError('Por favor, completa todos los campos obligatorios.');
        return;
      }

      if (mantenimiento) {
        await updateMantenimientoCorrectivo(mantenimiento.id, formData);
      } else {
        await createMantenimientoCorrectivo(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mantenimiento correctivo:', error);
      setError('Error al guardar el mantenimiento correctivo. Por favor, intenta de nuevo.');
    }
  };

  const isFormValid = () => {
    return formData.id_sucursal && formData.fecha_apertura && formData.numero_caso && formData.incidente && formData.rubro && formData.estado && formData.prioridad;
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Correctivo' : 'Crear Mantenimiento Correctivo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="id_sucursal">
            <Form.Label className="required required-asterisk">Sucursal</Form.Label>
            <Form.Select
              name="id_sucursal"
              value={formData.id_sucursal}
              onChange={handleChange}
              required
              className='form-select'
            >
              <option value="">Seleccione una sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="id_cuadrilla">
            <Form.Label>Cuadrilla</Form.Label>
            <Form.Select
              name="id_cuadrilla"
              value={formData.id_cuadrilla}
              onChange={handleChange}
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
      </Modal.Body>
    </Modal>
  );
};

export default MantenimientoCorrectivoForm;