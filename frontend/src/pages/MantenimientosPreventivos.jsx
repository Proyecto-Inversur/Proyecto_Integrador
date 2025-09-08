import { useState } from 'react';
import { Button, Container, Row, Col, Form, Collapse } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import BackButton from '../components/BackButton';
import DataTable from '../components/forms/DataTable';

import LoadingSpinner from '../components/LoadingSpinner';
import MantenimientoPreventivoForm from '../components/forms/MantenimientoPreventivoForm';
import useMantenimientoPreventivo from '../hooks/forms/useMantenimientoPreventivo';
import '../styles/botones_forms.css';

const MantenimientosPreventivos = () => {
  const [showFilters, setShowFilters] = useState(false)
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
  } = useMantenimientoPreventivo();

  const availableColumns = isUser
    ? [
        { key: 'id', label: 'ID' },
        { key: 'preventivo', label: 'Preventivo' },
        { key: 'cuadrilla', label: 'Cuadrilla' },
        { key: 'zona', label: 'Zona' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
        { key: 'acciones', label: 'Acciones' },
      ]
    : [
        { key: 'preventivo', label: 'Preventivo' },
        { key: 'zona', label: 'Zona' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
      ];

  const tableData = filteredMantenimientos.map((m) => ({
    ...m,
    preventivo: `${getSucursalNombre(m.id_sucursal)} - ${m.frecuencia}`,
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
              <h2>Gestión de Mantenimientos Preventivos</h2>
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
            <Col>
              <Button
                className={`filters-toggle ${showFilters ? "is-open" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
                aria-controls="filters-collapse"
                aria-expanded={showFilters}
              >
                <FiFilter />
                Filtros
              </Button>

              <Collapse in={showFilters}>
                <div id="filters-collapse" className="filters-container">
                  <div className='filters-row'>
                    {isUser && (
                      <div className='filter-item'>
                        <Form.Group className='mb-0'>
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
                    <div className='filter-item'>
                      <Form.Group className='mb-0'>
                        <Form.Label>Sucursal</Form.Label>
                        <Form.Select name="sucursal" value={filters.sucursal} onChange={handleFilterChange}>
                          <option value="">Todas</option>
                          {sucursales.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                    {isUser && (
                      <div className='filter-item'>
                        <Form.Group className='mb-0'>
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
                    <div className='filter-item'>
                      <Form.Group className='mb-0'>
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
            </Col>
          </Row>
          {showForm && (
            <MantenimientoPreventivoForm
              mantenimiento={selectedMantenimiento}
              onClose={handleFormClose}
            />
          )}
          <DataTable
            columns={availableColumns}
            data={tableData}
            entityKey="mantenimientos_preventivos"
            onEdit={isUser ? handleEdit : undefined}
            onDelete={isUser ? handleDelete : undefined}
            onRowClick={(row) => handleRowClick(row.id)}
          />
        </div>
      )}
    </Container>
  );
};

export default MantenimientosPreventivos;