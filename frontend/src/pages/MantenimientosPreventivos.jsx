import { useState } from 'react';
import { Button, Container, Row, Col, Form, Collapse, Alert } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import BackButton from '../components/BackButton';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import MantenimientoPreventivoForm from '../components/forms/MantenimientoPreventivoForm';
import useMantenimientoPreventivo from '../hooks/forms/useMantenimientoPreventivo';
import '../styles/botones_forms.css';

const MantenimientosPreventivos = () => {
  const [showFilters, setShowFilters] = useState(false)
  const {
    filteredMantenimientos,
    clientes,
    sucursales,
    cuadrillas,
    zonas,
    showForm,
    setShowForm,
    selectedMantenimiento,
    filters,
    error,
    success,
    isLoading,
    handleFilterChange,
    handleDelete,
    handleEdit,
    handleRowClick,
    handleFormClose,
    getSucursalNombre,
    getClienteNombre,
    getCuadrillaNombre,
    getZonaNombre,
    isUser,
    setError,
    setSuccess
  } = useMantenimientoPreventivo();

  const availableColumns = isUser
    ? [
        { key: 'id', label: 'ID' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'preventivo', label: 'Preventivo' },
        { key: 'cuadrilla', label: 'Cuadrilla' },
        { key: 'zona', label: 'Zona' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
        { key: 'acciones', label: 'Acciones' },
      ]
    : [
        { key: 'cliente', label: 'Cliente' },
        { key: 'preventivo', label: 'Preventivo' },
        { key: 'zona', label: 'Zona' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
      ];

  const tableData = filteredMantenimientos.map((m) => ({
    ...m,
    cliente: getClienteNombre(m.cliente_id || m.id_cliente),
    preventivo: `${getSucursalNombre(m.id_sucursal)} - ${m.frecuencia}`,
    cuadrilla: getCuadrillaNombre(m.id_cuadrilla),
    zona: getZonaNombre(m.id_sucursal),
    fecha_apertura: m.fecha_apertura?.split('T')[0],
    fecha_cierre: m.fecha_cierre ? m.fecha_cierre?.split('T')[0] : 'No hay Fecha',
  }));

  const sucursalOptions = filters.cliente
    ? sucursales.filter((s) => String(s.cliente_id) === filters.cliente)
    : sucursales;

  const filterButton = (
    <Button
      className={`filters-toggle ${showFilters ? "is-open" : ""}`}
      onClick={() => setShowFilters(!showFilters)}
      aria-controls="filters-collapse"
      aria-expanded={showFilters}
    >
      <FiFilter />
      Filtros
    </Button>
  );

  const filterContent = (
    <Collapse in={showFilters}>
      <div id="filters-collapse" className="maintenance-filters-container">
        <div className='maintenance-filters-row'>
          {isUser && (
            <div className='maintenance-filter-item'>
              <Form.Group className='mb-0' controlId="filterCuadrilla">
                <Form.Label>Cuadrilla</Form.Label>
                <Form.Select name="cuadrilla" value={filters.cuadrilla} onChange={handleFilterChange}>
                  <option value="">Todas</option>
                  {cuadrillas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}
          <div className='maintenance-filter-item'>
            <Form.Group className='mb-0' controlId="filterCliente">
              <Form.Label>Cliente</Form.Label>
              <Form.Select name="cliente" value={filters.cliente} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className='maintenance-filter-item'>
            <Form.Group className='mb-0' controlId="filterSucursal">
              <Form.Label>Sucursal</Form.Label>
              <Form.Select name="sucursal" value={filters.sucursal} onChange={handleFilterChange}>
                <option value="">Todas</option>
                {sucursalOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          {isUser && (
            <div className='maintenance-filter-item'>
              <Form.Group className='mb-0' controlId="filterZona">
                <Form.Label>Zona</Form.Label>
                <Form.Select name="zona" value={filters.zona} onChange={handleFilterChange}>
                  <option value="">Todas</option>
                  {zonas.map((z) => (
                    <option key={z.id} value={z.nombre}>
                      {z.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}
          <div className='maintenance-filter-item'>
            <Form.Group className='mb-0' controlId="filterSortByDate">
              <Form.Label>Ordenar por Fecha</Form.Label>
              <Form.Select name="sortByDate" value={filters.sortByDate} onChange={handleFilterChange}>
                <option value="desc">Más reciente</option>
                <option value="asc">Más antiguo</option>
              </Form.Select>
            </Form.Group>
          </div>
        </div>
      </div>
    </Collapse>
  );

  return (
    <Container className="custom-container">
      <BackButton to="/mantenimiento" />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Mantenimientos Preventivos</h2>
            </Col>
            <Col className="text-end d-flex justify-content-end gap-2">
              {filterButton}
              {isUser && (
                <Button className="custom-button" onClick={() => setShowForm(true)}>
                  <FaPlus />
                  Agregar
                </Button>
              )}
            </Col>
          </Row>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success" className="mt-3">{success}</Alert>}
          {showForm && (
            <MantenimientoPreventivoForm
              mantenimiento={selectedMantenimiento}
              onClose={handleFormClose}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
          <DataTable
            columns={availableColumns}
            data={tableData}
            entityKey="mantenimientos_preventivos"
            onEdit={isUser ? handleEdit : undefined}
            onDelete={isUser ? handleDelete : undefined}
            onRowClick={(row) => handleRowClick(row.id)}
            filterContent={filterContent}
          />
        </div>
      )}
    </Container>
  );
};

export default MantenimientosPreventivos;
