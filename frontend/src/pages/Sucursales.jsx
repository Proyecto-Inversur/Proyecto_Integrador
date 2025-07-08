import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import SucursalForm from '../components/SucursalForm';
import BackButton from '../components/BackButton';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getSucursales, deleteSucursal } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import '../styles/botones_forms.css';

const Sucursales = () => {
  const { currentEntity } = useContext(AuthContext);
  const [sucursales, setSucursales] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSucursales = async () => {
    setIsLoading(true);
    try {
      const response = await getSucursales();
      setSucursales(response.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZonas = async () => {
    setIsLoading(true);
    try {
      const response = await getZonas();
      setZonas(response.data);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      await deleteSucursal(id);
      fetchSucursales();
    } catch (error) {
      console.error('Error deleting sucursal:', error);
    } finally {
      setIsLoading(false);
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
      {isLoading ? (
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div>
          <BackButton />
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
                  <th className="acciones-col">Acciones</th>
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
                  <td className="action-cell">
                    <button
                      className="action-btn edit me-2"
                      onClick={() => handleEdit(sucursal)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(sucursal.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
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

export default Sucursales;