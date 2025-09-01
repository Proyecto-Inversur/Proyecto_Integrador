import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import SucursalForm from '../components/SucursalForm';
import { getSucursales, deleteSucursal } from '../services/sucursalService';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [sucursales, setSucursales] = useState([]);
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

  useEffect(() => {
    fetchSucursales();
  }, []);

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