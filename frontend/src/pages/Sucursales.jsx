import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import SucursalForm from '../components/SucursalForm';
import { getSucursales, deleteSucursal } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const Sucursales = () => {
  const { currentEntity } = useContext(AuthContext);
  const [sucursales, setSucursales] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  const fetchSucursales = async () => {
    try {
      const response = await getSucursales();
      setSucursales(response.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    }
  };

  const fetchZonas = async () => {
    try {
      const response = await getZonas();
      setZonas(response.data);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  useEffect(() => {
    if (currentEntity.type === 'usuario') {
      fetchSucursales();
      fetchZonas();
    }
    else if (currentEntity) {
      navigate('/');
    }
    else {
      navigate('/login');
    }
  }, [currentEntity]);

  const handleDelete = async (id) => {
    try {
      await deleteSucursal(id);
      fetchSucursales();
    } catch (error) {
      console.error('Error deleting sucursal:', error);
    }
  };

  const handleEdit = (sucursal) => {
    setSelectedSucursal(sucursal);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSucursal(null);
    fetchSucursales();
  };

  return (
    <Container className="custom-container">
      <Row className="align-items-center mb-2">
        <Col>
          <h2>Gestión de Sucursales</h2>
        </Col>
        <Col className="text-end">
          <Button className="custom-button" onClick={() => setShowForm(true)}>
            <FaPlus />
            Agregar
          </Button>
        </Col>
      </Row>

      {showForm && (
        <SucursalForm
          sucursal={selectedSucursal}
          onClose={handleFormClose}
        />
      )}

      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Zona</th>
              <th>Dirección</th>
              <th>Superficie</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.map((sucursal) => (
              <tr key={sucursal.id}>
                <td>{sucursal.id}</td>
                <td>{sucursal.nombre}</td>
                <td>{sucursal.zona}</td>
                <td>{sucursal.direccion}</td>
                <td>{sucursal.superficie}</td>
                <td>
                  <Button
                    variant="warning"
                    className="me-2"
                    onClick={() => handleEdit(sucursal)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(sucursal.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default Sucursales;