import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Alert } from 'react-bootstrap';
import CuadrillaForm from '../components/CuadrillaForm';
import { getCuadrillas, deleteCuadrilla } from '../services/cuadrillaService';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/botones_forms.css';

const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const Cuadrillas = () => {
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
    fetchCuadrillas();
  }, []);

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
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
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
          <DataTable
            columns={availableColumns}
            data={cuadrillas}
            entityKey="cuadrillas"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </Container>
  );
};

export default Cuadrillas;