import React from 'react';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import MantenimientoCorrectivoForm from '../components/MantenimientoCorrectivoForm';
import BackButton from '../components/BackButton';
import { FaPlus } from 'react-icons/fa';
import useMantenimientoCorrectivo from '../hooks/useMantenimientoCorrectivo';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/botones_forms.css';

const MantenimientosCorrectivos = () => {
  const {
    filteredMantenimientos,
    sucursales,
    cuadrillas,
    zonas,
    showForm,
    setShowForm,
    selectedMantenimiento,
    filters,
    isLoading,
    handleFilterChange,
    handleDelete,
    handleEdit,
    handleRowClick,
    handleFormClose,
    getSucursalNombre,
    getCuadrillaNombre,
    getZonaNombre,
    isUser
  } = useMantenimientoCorrectivo();

  const availableColumns = isUser
    ? [
        { key: 'id', label: 'ID' },
        { key: 'sucursal', label: 'Sucursal' },
        { key: 'cuadrilla', label: 'Cuadrilla' },
        { key: 'zona', label: 'Zona' },
        { key: 'rubro', label: 'Rubro' },
        { key: 'numero_caso', label: 'Número de Caso' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
        { key: 'incidente', label: 'Incidente' },
        { key: 'estado', label: 'Estado' },
        { key: 'prioridad', label: 'Prioridad' },
        { key: 'acciones', label: 'Acciones' },
      ]
    : [
        { key: 'sucursal', label: 'Sucursal' },
        { key: 'zona', label: 'Zona' },
        { key: 'rubro', label: 'Rubro' },
        { key: 'numero_caso', label: 'Número de Caso' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
        { key: 'incidente', label: 'Incidente' },
        { key: 'estado', label: 'Estado' },
        { key: 'prioridad', label: 'Prioridad' },
      ];

  const tableData = filteredMantenimientos.map((m) => ({
    ...m,
    sucursal: getSucursalNombre(m.id_sucursal),
    cuadrilla: getCuadrillaNombre(m.id_cuadrilla),
    zona: getZonaNombre(m.id_sucursal),
    fecha_apertura: m.fecha_apertura?.split('T')[0],
    fecha_cierre: m.fecha_cierre ? m.fecha_cierre?.split('T')[0] : 'No hay Fecha',
  }));

  return (
    <Container className="custom-container">
      <BackButton to="/mantenimiento" />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Mantenimientos Correctivos</h2>
            </Col>
            <Col className="text-end">
              {isUser && (
                <Button className="custom-button" onClick={() => setShowForm(true)}>
                  <FaPlus />
                  Agregar
                </Button>
              )}
            </Col>
          </Row>
          <Row className="mb-3 justify-content-center">
            {isUser && (
              <Col xs={12} sm={6} md={3} lg={2}>
                <Form.Group>
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select name="cuadrilla" value={filters.cuadrilla} onChange={handleFilterChange}>
                    <option value="">Todas</option>
                    {cuadrillas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Sucursal</Form.Label>
                <Form.Select name="sucursal" value={filters.sucursal} onChange={handleFilterChange}>
                  <option value="">Todas</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {isUser && (
              <Col xs={12} sm={6} md={3} lg={2}>
                <Form.Group>
                  <Form.Label>Zona</Form.Label>
                  <Form.Select name="zona" value={filters.zona} onChange={handleFilterChange}>
                    <option value="">Todas</option>
                    {zonas.map(z => (
                      <option key={z.id} value={z.nombre}>{z.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Rubro</Form.Label>
                <Form.Select name="rubro" value={filters.rubro} onChange={handleFilterChange}>
                  <option value="">Todos</option>
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
            </Col>
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select name="estado" value={filters.estado} onChange={handleFilterChange}>
                  {isUser && (
                    <option value="Finalizado">Finalizado</option>
                  )}
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="A Presupuestar">A Presupuestar</option>
                  <option value="Presupuestado">Presupuestado</option>
                  <option value="Presupuesto Aprobado">Presupuesto Aprobado</option>
                  <option value="Esperando Respuesta Bancor">Esperando Respuesta Bancor</option>
                  <option value="Aplazado">Aplazado</option>
                  <option value="Desestimado">Desestimado</option>
                  <option value="Solucionado">Solucionado</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Prioridad</Form.Label>
                <Form.Select name="prioridad" value={filters.prioridad} onChange={handleFilterChange}>
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Ordenar por Fecha</Form.Label>
                <Form.Select name="sortByDate" value={filters.sortByDate} onChange={handleFilterChange}>
                  <option value="desc">Más reciente</option>
                  <option value="asc">Más antiguo</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {showForm && (
            <MantenimientoCorrectivoForm
              mantenimiento={selectedMantenimiento}
              onClose={handleFormClose}
            />
          )}
          <DataTable
            columns={availableColumns}
            data={tableData}
            entityKey="mantenimientos_correctivos"
            onEdit={isUser ? handleEdit : undefined}
            onDelete={isUser ? handleDelete : undefined}
            onRowClick={(row) => handleRowClick(row.id)}
          />
        </div>
      )}
    </Container>
  );
};

export default MantenimientosCorrectivos;