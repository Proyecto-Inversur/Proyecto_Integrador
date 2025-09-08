import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/forms/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import SucursalForm from '../components/forms/SucursalForm';
import useSucursales from '../hooks/forms/useSucursales';
import '../styles/botones_forms.css';

const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'superficie', label: 'Superficie' },
  { key: 'acciones', label: 'Acciones' },
];

const Sucursales = () => {
  const {
    sucursales, 
    showForm,
    setShowForm,
    selectedSucursal, 
    isLoading, 
    handleDelete, 
    handleEdit, 
    handleFormClose
  } = useSucursales();

  return (
    <Container className="custom-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
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
          <DataTable
            columns={availableColumns}
            data={sucursales}
            entityKey="sucursales"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </Container>
  );
};

export default Sucursales;