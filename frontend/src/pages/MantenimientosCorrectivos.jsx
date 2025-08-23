import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Row, Col, Form } from 'react-bootstrap';
import MantenimientoCorrectivoForm from '../components/MantenimientoCorrectivoForm';
import BackButton from '../components/BackButton';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getMantenimientosCorrectivos, deleteMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getZonas } from '../services/zonaService';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';
import ColumnSelector from '../components/ColumnSelector';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import '../styles/botones_forms.css';

const MantenimientosCorrectivos = () => {
  const { currentEntity } = useContext(AuthContext);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const [filters, setFilters] = useState({
    cuadrilla: '',
    sucursal: '',
    zona: '',
    rubro: '',
    estado: '',
    prioridad: '',
    sortByDate: 'desc',
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const availableColumns = currentEntity.type === 'usuario'
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
        { key: 'rubro', label: 'Rubro' },
        { key: 'fecha_apertura', label: 'Fecha Apertura' },
        { key: 'estado', label: 'Estado' },
        { key: 'prioridad', label: 'Prioridad' },
      ];
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.map((c) => c.key)
  );

  const fetchMantenimientos = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientosCorrectivos();
      const mantenimientoArray = currentEntity.type === 'cuadrilla'
        ? response.data.filter(m => m.id_cuadrilla === currentEntity.data.id && m.estado !== 'Finalizado')
        : response.data;
      setMantenimientos(mantenimientoArray);
      setFilteredMantenimientos(mantenimientoArray);
    } catch (error) {
      console.error('Error fetching mantenimientos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [sucursalesResponse, cuadrillasResponse, zonasResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
        getZonas(),
      ]);
      
      const sucursalesConMantenimientos = sucursalesResponse.data.filter(sucursal =>
        mantenimientos.some(m => m.id_sucursal === sucursal.id)
      );

      setSucursales(sucursalesConMantenimientos);
      setCuadrillas(cuadrillasResponse.data);
      setZonas(zonasResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
    loadPreferences();
  }, []);

  useEffect(() => {
    fetchData();
  }, [mantenimientos]);

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);

    let filtered = [...mantenimientos];

    if (newFilters.cuadrilla) {
      filtered = filtered.filter(m => m.id_cuadrilla === parseInt(newFilters.cuadrilla));
    }
    if (newFilters.sucursal) {
      filtered = filtered.filter(m => m.id_sucursal === parseInt(newFilters.sucursal));
    }
    if (newFilters.zona) {
      filtered = filtered.filter(m => {
        const sucursal = sucursales.find(s => s.id === m.id_sucursal);
        return sucursal?.zona?.toLowerCase() === newFilters.zona.toLowerCase();
      });
    }
    if (newFilters.rubro) {
      filtered = filtered.filter(m => m.rubro.toLowerCase() === newFilters.rubro.toLowerCase());
    }
    if (newFilters.estado) {
      filtered = filtered.filter(m => m.estado.toLowerCase() === newFilters.estado.toLowerCase());
    }
    if (newFilters.prioridad) {
      filtered = filtered.filter(m => m.prioridad.toLowerCase() === newFilters.prioridad.toLowerCase());
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_apertura);
      const dateB = new Date(b.fecha_apertura);
      return newFilters.sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredMantenimientos(filtered);
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    if (currentEntity.type === 'usuario') {
      try {
        await deleteMantenimientoCorrectivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento correctivo:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleRowClick = (mantenimientoId) => {
    navigate('/correctivo', { state: { mantenimientoId } });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
  };

  const loadPreferences = async () => {
    try {
      const response = await getColumnPreferences('mantenimientos_correctivos');
      let cols = response.data?.columns || availableColumns.map((c) => c.key);
      if (cols.length === 0) {
        if (currentEntity.type === 'usuario') {
          cols = ['id', 'sucursal', 'cuadrilla', 'zona', 'rubro', 'numero_caso', 'fecha_apertura', 'fecha_cierre', 'incidente', 'estado', 'prioridad', 'acciones'];
        }
        else {
          cols = ['sucursal', 'rubro', 'fecha_apertura', 'estado', 'prioridad'];
        }
      }
      setSelectedColumns(cols);
    } catch {
      setSelectedColumns(availableColumns.map((c) => c.key));
    }
  };

  const handleSaveColumns = async (cols) => {
    setSelectedColumns(cols);
    try {
      await saveColumnPreferences('mantenimientos_correctivos', cols);
    } catch (e) {
      setError(error.response?.data?.detail || 'Error al seleccionar columnas');
    }
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'No Hay Cuadrilla asignada';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  return (
    <Container className="custom-container">
      <BackButton to="/mantenimiento" />
      {isLoading ? (
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="contenido-wrapper">
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Mantenimientos Correctivos</h2>
            </Col>
            <Col className="text-end">
              {currentEntity.type === 'usuario' && (
                <Button className="custom-button" onClick={() => setShowForm(true)}>
                  <FaPlus />
                  Agregar
                </Button>
              )}
            </Col>
          </Row>
          <Row className="mb-3 justify-content-center">
            {currentEntity.type === 'usuario' && (
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
            {currentEntity.type === 'usuario' && (
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
                  {currentEntity.type === 'usuario' && (
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

          <div className="table-responsive">
            <ColumnSelector
              availableColumns={availableColumns}
              selectedColumns={selectedColumns}
              onSave={handleSaveColumns}
            />
            <Table striped bordered hover>
              <thead>
                <tr>
                  {currentEntity.type === 'usuario' &&
                    selectedColumns.includes('id') && <th>ID</th>}
                  {selectedColumns.includes('sucursal') && <th>Sucursal</th>}
                  {currentEntity.type === 'usuario' &&
                    selectedColumns.includes('cuadrilla') && <th>Cuadrilla</th>}
                  {selectedColumns.includes('zona') && <th>Zona</th>}
                  {selectedColumns.includes('rubro') && <th>Rubro</th>}
                  {selectedColumns.includes('numero_caso') && <th>Número de Caso</th>}
                  {selectedColumns.includes('fecha_apertura') && <th>Fecha Apertura</th>}
                  {selectedColumns.includes('fecha_cierre') && <th>Fecha Cierre</th>}
                  {selectedColumns.includes('incidente') && <th>Incidente</th>}
                  {selectedColumns.includes('estado') && <th>Estado</th>}
                  {selectedColumns.includes('prioridad') && <th>Prioridad</th>}
                  {currentEntity.type === 'usuario' &&
                    selectedColumns.includes('acciones') && (
                      <th className="acciones-col">Acciones</th>
                    )}
                </tr>
              </thead>
              <tbody>
                {filteredMantenimientos.map((mantenimiento) => (
                  <tr
                    key={mantenimiento.id}
                    onClick={() => handleRowClick(mantenimiento.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {currentEntity.type === 'usuario' &&
                      selectedColumns.includes('id') && (
                        <td>{mantenimiento.id}</td>
                      )}
                    {selectedColumns.includes('sucursal') && (
                      <td>{getSucursalNombre(mantenimiento.id_sucursal)}</td>
                    )}
                    {currentEntity.type === 'usuario' &&
                      selectedColumns.includes('cuadrilla') && (
                        <td>{getCuadrillaNombre(mantenimiento.id_cuadrilla)}</td>
                      )}
                    {selectedColumns.includes('zona') && (
                        <td>{getZonaNombre(mantenimiento.id_sucursal)}</td>
                      )}
                    {selectedColumns.includes('rubro') && (
                      <td>{mantenimiento.rubro}</td>
                    )}
                    {selectedColumns.includes('numero_caso') && (
                        <td>{mantenimiento.numero_caso}</td>
                      )}
                    {selectedColumns.includes('fecha_apertura') && (
                      <td>{mantenimiento.fecha_apertura?.split('T')[0]}</td>
                    )}
                    {selectedColumns.includes('fecha_cierre') && (
                        <td>
                          {mantenimiento.fecha_cierre
                            ? mantenimiento.fecha_cierre?.split('T')[0]
                            : 'No hay Fecha'}
                        </td>
                      )}
                    {selectedColumns.includes('incidente') && (
                        <td>{mantenimiento.incidente}</td>
                      )}
                    {selectedColumns.includes('estado') && (
                      <td>{mantenimiento.estado}</td>
                    )}
                    {selectedColumns.includes('prioridad') && (
                      <td>{mantenimiento.prioridad}</td>
                    )}
                    {currentEntity.type === 'usuario' &&
                      selectedColumns.includes('acciones') && (
                        <td
                          className="action-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="action-btn edit me-2"
                            aria-label="Editar"
                            onClick={() => handleEdit(mantenimiento)}
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="action-btn delete"
                            aria-label="Eliminar"
                            onClick={() => handleDelete(mantenimiento.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </Container>
  );
};

export default MantenimientosCorrectivos;