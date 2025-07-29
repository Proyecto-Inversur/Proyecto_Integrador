import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Row, Col, Form } from 'react-bootstrap';
import MantenimientoPreventivoForm from '../components/MantenimientoPreventivoForm';
import BackButton from '../components/BackButton';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getMantenimientosPreventivos, deleteMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import '../styles/botones_forms.css';

const MantenimientosPreventivos = () => {
  const { currentEntity } = useContext(AuthContext);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const [filters, setFilters] = useState({
      cuadrilla: '',
      sucursal: '',
      zona: '',
      sortByDate: 'desc',
    });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const fetchMantenimientos = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientosPreventivos();
      const mantenimientoArray = currentEntity.type === 'cuadrilla'
        ? response.data.filter(m => m.id_cuadrilla === currentEntity.data.id)
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
    setIsLoading(true);
    try {
      const [cuadrillasResponse, sucursalesResponse, zonasResponse] = await Promise.all([
        getCuadrillas(),
        getSucursales(),
        getZonas(),
      ]);
      setCuadrillas(cuadrillasResponse.data);
      setSucursales(sucursalesResponse.data);
      setZonas(zonasResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
    fetchData();
  }, []);

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
        await deleteMantenimientoPreventivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento:', error);
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
    navigate('/preventivo', { state: { mantenimientoId } });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
    fetchData();
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  return (
    <Container className="custom-container">
      {isLoading ? (
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="contenido-wrapper">
          <BackButton to="/mantenimiento" />
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Mantenimientos Preventivos</h2>
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

          <Row className="mb-3">
            <Col md={2}>
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
            <Col md={2}>
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
            <Col md={2}>
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
            <Col md={2}>
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
            <MantenimientoPreventivoForm
              mantenimiento={selectedMantenimiento}
              onClose={handleFormClose}
            />
          )}
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Preventivo</th>
                  <th>Cuadrilla</th>
                  <th>Zona</th>
                  <th>Fecha Apertura</th>
                  <th>Fecha Cierre</th>
                  {currentEntity.type === 'usuario' && (
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
                    <td>{mantenimiento.id}</td>
                    <td>{getSucursalNombre(mantenimiento.id_sucursal)} - {mantenimiento.frecuencia}</td>
                    <td>{getCuadrillaNombre(mantenimiento.id_cuadrilla)}</td>
                    <td>{getZonaNombre(mantenimiento.id_sucursal)}</td>
                    <td>{mantenimiento.fecha_apertura?.split('T')[0]}</td>
                    <td>{mantenimiento.fecha_cierre ? mantenimiento.fecha_cierre?.split('T')[0] : 'No hay Fecha'}</td>
                    {currentEntity.type === 'usuario' && (
                      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="action-btn edit me-2"
                          onClick={() => handleEdit(mantenimiento)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="action-btn delete"
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

export default MantenimientosPreventivos;