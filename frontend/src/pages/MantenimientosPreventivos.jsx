import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import MantenimientoPreventivoForm from '../components/MantenimientoPreventivoForm';
import { getMantenimientosPreventivos, deleteMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getPreventivos } from '../services/preventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const MantenimientosPreventivos = () => {
  const { currentEntity } = useContext(AuthContext);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const navigate = useNavigate();

  const fetchMantenimientos = async () => {
    try {
      const response = await getMantenimientosPreventivos();
      setMantenimientos(response.data);
    } catch (error) {
      console.error('Error fetching mantenimientos:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [preventivosResponse, cuadrillasResponse] = await Promise.all([
        getPreventivos(),
        getCuadrillas(),
      ]);
      setPreventivos(preventivosResponse.data);
      setCuadrillas(cuadrillasResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (currentEntity) {
      fetchMantenimientos();
      fetchData();
    }
    else {
      navigate('/login');
    }
  }, [currentEntity]);

  const handleDelete = async (id) => {
    if (currentEntity.type === 'usuario') {
      try {
        await deleteMantenimientoPreventivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento:', error);
      }
    }
  };

  const handleEdit = (mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleRowClick = (mantenimiento) => {
    navigate('/preventivo', { state: { mantenimiento } });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
    fetchData();
  };

  const getSucursalNombre = (id_sucursal) => {
    const preventivo = preventivos.find((p) => p.id_sucursal === id_sucursal);
    return preventivo ? preventivo.nombre_sucursal : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  return (
    <Container className="custom-container">
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

      {showForm && (
        <MantenimientoPreventivoForm
          mantenimiento={selectedMantenimiento}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Preventivo</th>
            <th>Cuadrilla</th>
            <th>Fecha Apertura</th>
            <th>Fecha Cierre</th>
            {currentEntity.type === 'usuario' && (
              <th>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mantenimiento) => (
            <tr 
              key={mantenimiento.id} 
              onClick={() => handleRowClick(mantenimiento)}
              style={{ cursor: 'pointer' }}
            >
              <td>{mantenimiento.id}</td>
              <td>{getSucursalNombre(mantenimiento.id_sucursal)} - {mantenimiento.frecuencia}</td>
              <td>{getCuadrillaNombre(mantenimiento.id_cuadrilla)}</td>
              <td>{mantenimiento.fecha_apertura?.split('T')[0]}</td>
              <td>{mantenimiento.fecha_cierre ? mantenimiento.fecha_cierre?.split('T')[0] : 'No hay Fecha'}</td>
              {currentEntity.type === 'usuario' && (
                <td onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="warning"
                    className="me-2"
                    onClick={() => handleEdit(mantenimiento)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(mantenimiento.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default MantenimientosPreventivos;