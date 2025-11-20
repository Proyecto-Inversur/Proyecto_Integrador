import React from 'react';
import { Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import CuadrillaForm from '../components/forms/CuadrillaForm';
import useCuadrillas from '../hooks/forms/useCuadrillas';
import '../styles/botones_forms.css';

const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const Cuadrillas = () => {
  const {
    cuadrillas, 
    showForm,
    setShowForm,
    selectedCuadrilla, 
    error,
    success,
    isLoading, 
    handleDelete, 
    handleEdit, 
    handleFormClose,
    setError,
    setSuccess
  } = useCuadrillas();

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
          {success && <Alert variant="success" className="mt-3">{success}</Alert>}
          {showForm && (
            <CuadrillaForm
              cuadrilla={selectedCuadrilla}
              onClose={handleFormClose}
              error={error}
              setError={setError}
              setSuccess={setSuccess}
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