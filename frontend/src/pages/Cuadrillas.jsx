import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import CuadrillaForm from '../components/CuadrillaForm';
import { getCuadrillas, deleteCuadrilla } from '../services/cuadrillaService';
import { AuthContext } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const Cuadrillas = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCuadrilla, setSelectedCuadrilla] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCuadrillas = async () => {
    setIsLoading(true);
    try {
      const response = await getCuadrillas();
      setCuadrillas(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al cargar las cuadrillas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentEntity.type === 'usuario') {
      fetchCuadrillas();
    }
    else if (currentEntity) {
      navigate('/');
    }
    else {
      navigate('/login');
    }
  }, [currentEntity, navigate]);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await deleteCuadrilla(id);
      fetchCuadrillas();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al eliminar la cuadrilla');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cuadrilla) => {
    setSelectedCuadrilla(cuadrilla);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCuadrilla(null);
    fetchCuadrillas();
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
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Cuadrillas</h2>
            </Col>
            <Col className="text-end">
              <Button className="custom-button" onClick={() => setShowForm(true)}>
                <FaPlus />
                Agregar
              </Button>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          {showForm && (
            <CuadrillaForm
              cuadrilla={selectedCuadrilla}
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
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuadrillas.map((cuadrilla) => (
                  <tr key={cuadrilla.id}>
                    <td>{cuadrilla.id}</td>
                    <td>{cuadrilla.nombre}</td>
                    <td>{cuadrilla.zona}</td>
                    <td>{cuadrilla.email}</td>
                    <td>
                      <Button
                        variant="warning"
                        className="me-2"
                        onClick={() => handleEdit(cuadrilla)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(cuadrilla.id)}
                      >
                        Eliminar
                      </Button>
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

export default Cuadrillas;