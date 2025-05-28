import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import MantenimientoCorrectivoForm from '../components/MantenimientoCorrectivoForm';
import { getMantenimientosCorrectivos, deleteMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const MantenimientosCorrectivos = () => {
  const { currentEntity } = useContext(AuthContext);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);

  const fetchMantenimientos = async () => {
    try {
      const response = await getMantenimientosCorrectivos();
      setMantenimientos(response.data);
    } catch (error) {
      console.error('Error fetching mantenimientos correctivos:', error);
    }
  };

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
        await deleteMantenimientoCorrectivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento correctivo:', error);
      }
    }
  };

  const handleEdit = (mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  return (
    <Container className="custom-container">
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

      {showForm && (
        <MantenimientoCorrectivoForm
          mantenimiento={selectedMantenimiento}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sucursal</th>
            <th>Cuadrilla</th>
            <th>Fecha Apertura</th>
            <th>Incidente</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mantenimiento) => (
            <tr key={mantenimiento.id}>
              <td>{mantenimiento.id}</td>
              <td>{getSucursalNombre(mantenimiento.id_sucursal)}</td>
              <td>{getCuadrillaNombre(mantenimiento.id_cuadrilla)}</td>
              <td>{mantenimiento.fecha_apertura?.split('T')[0]}</td>
              <td>{mantenimiento.incidente}</td>
              <td>{mantenimiento.estado}</td>
              <td>{mantenimiento.prioridad}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(mantenimiento)}
                >
                  Editar
                </Button>
                {currentEntity.type === 'usuario' && (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(mantenimiento.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default MantenimientosCorrectivos;