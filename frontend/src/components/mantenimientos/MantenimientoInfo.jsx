import React from 'react';
import { Col, Form, Button, Alert } from 'react-bootstrap';
import { FiPlusCircle, FiCheckCircle } from 'react-icons/fi';
import { BsSave } from 'react-icons/bs';

const MantenimientoInfo = ({
  title,
  mantenimiento,
  isUser,
  formData,
  getSucursalNombre,
  getCuadrillaNombre,
  getZonaNombre,
  formatExtendido,
  handleExtendidoChange,
  handleSubmit,
  error,
  success,
  toggleRoute,
  isSelected,
  isLoading,
  showFinishButton,
  handleFinish,
  handleChange,
}) => (
  <Col className="info-section">
    <h4 className="info-section-title">{title}</h4>
    <div className="info-field">
      <strong className="info-label">
        {mantenimiento.frecuencia ? 'Sucursal - Frecuencia:' : 'Sucursal:'}
      </strong>{' '}
      {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : 'N/A'}
      {mantenimiento.frecuencia && ` - ${mantenimiento.frecuencia}`}
    </div>
    <div className="info-field">
      <strong className="info-label">Cuadrilla:</strong>{' '}
      {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
    </div>
    <div className="info-field">
      <strong className="info-label">Zona:</strong>{' '}
      {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : 'N/A'}
    </div>
    <div className="info-field">
      <strong className="info-label">Fecha Apertura:</strong>{' '}
      {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
    </div>
    {mantenimiento.numero_caso && (
      <div className="info-field">
        <strong className="info-label">Numero de Caso:</strong>{' '}
        {mantenimiento.numero_caso}
      </div>
    )}
    {mantenimiento.incidente && (
      <div className="info-field">
        <strong className="info-label">Incidente:</strong>{' '}
        {mantenimiento.incidente}
      </div>
    )}
    {mantenimiento.rubro && (
      <div className="info-field">
        <strong className="info-label">Rubro:</strong>{' '}
        {mantenimiento.rubro}
      </div>
    )}
    {mantenimiento.prioridad && (
      <div className="info-field">
        <strong className="info-label">Prioridad:</strong>{' '}
        {mantenimiento.prioridad}
      </div>
    )}
    {mantenimiento.estado && mantenimiento.numero_caso && (
      <div className="info-field">
        <strong className="info-label">Estado:</strong>{' '}
        {mantenimiento.estado}
      </div>
    )}
    <div className="info-field">
      <strong className="info-label">Fecha Cierre:</strong>{' '}
      {mantenimiento.fecha_cierre?.split('T')[0] || 'Mantenimiento no finalizado'}
    </div>
    <div className="info-field">
      <strong className="info-label">Extendido:</strong>{' '}
      {mantenimiento.extendido
        ? `${formatExtendido(mantenimiento.extendido)} hs`
        : 'No hay extendido'}
    </div>
    {!isUser && (
      <Form className="info-form" onSubmit={handleSubmit}>
        <Form.Group className="extendido-row" controlId="formExtendido">
          <Form.Label className="extendido-label">Extendido:</Form.Label>
          <Form.Control
            type="datetime-local"
            name="extendido"
            value={formData?.extendido}
            onChange={handleExtendidoChange}
            placeholder="Seleccionar fecha"
            className="extendido-input"
          />
        </Form.Group>
        {formData.extendido && (
          <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
            <BsSave className="me-2" /> Guardar Información
          </Button>
        )}
      </Form>
    )}
    {!isUser && (
      <Button
        variant={isSelected ? 'danger' : 'success'}
        className="info-button-add"
        onClick={toggleRoute}
      >
        <FiPlusCircle className="me-2" size={18} />
        {isSelected ? 'Borrar de la ruta' : 'Agregar a la ruta actual'}
      </Button>
    )}
    {showFinishButton && !isUser && (
      <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
        <FiCheckCircle className="me-2" size={18} />Marcar como finalizado
      </Button>
    )}
    {title === "Mantenimiento Preventivo" && isUser && (
      <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
        <FiCheckCircle className="me-2" size={18} />
        {showFinishButton ? 'Marcar como finalizado' : 'Marcar como pendiente'}
      </Button>
    )}
    {isUser && handleChange && (
      <Form className="info-form" onSubmit={handleSubmit}>
        <Form.Group className="extendido-row" controlId="estado">
          <Form.Label className="extendido-label">Estado</Form.Label>
          <Form.Select
            name="estado"
            value={formData?.estado || ''}
            onChange={handleChange}
            className="form-select"
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
        {formData.estado && formData.estado !== mantenimiento.estado && (
          <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
            <BsSave className="me-2" /> Guardar Estado
          </Button>
        )}
      </Form>
    )}
    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    {success && <Alert variant="success" className="mt-3">{success}</Alert>}
  </Col>
);

export default MantenimientoInfo;