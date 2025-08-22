import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import CuadrillaForm from '../components/CuadrillaForm';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getCuadrillas, deleteCuadrilla } from '../services/cuadrillaService';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';
import ColumnSelector from '../components/ColumnSelector';
import { FaPlus } from 'react-icons/fa';
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
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.map((c) => c.key)
  );

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

  const loadPreferences = async () => {
    try {
      const response = await getColumnPreferences('cuadrillas');
      const cols = response.data?.columns || availableColumns.map((c) => c.key);
      if (cols.length == 0) {
        cols = ['id', 'nombre', 'zona', 'email', 'acciones'];
      }
      setSelectedColumns(cols);
    } catch {
      setSelectedColumns(availableColumns.map((c) => c.key));
    }
  };

  useEffect(() => {
    fetchCuadrillas();
    loadPreferences();
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

  const handleSaveColumns = async (cols) => {
    setSelectedColumns(cols);
    try {
      await saveColumnPreferences('cuadrillas', cols);
    } catch (e) {
      setError(error.response?.data?.detail || 'Error al seleccionar columnas');
    }
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
          <Row className="align-items-center mb-2">
            <Col>
              <h2>Gestión de Cuadrillas</h2>
            </Col>
            <Col className="text-end">
              <ColumnSelector
                availableColumns={availableColumns}
                selectedColumns={selectedColumns}
                onSave={handleSaveColumns}
              />
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
                  {selectedColumns.includes('id') && <th>ID</th>}
                  {selectedColumns.includes('nombre') && <th>Nombre</th>}
                  {selectedColumns.includes('zona') && <th>Zona</th>}
                  {selectedColumns.includes('email') && <th>Email</th>}
                  {selectedColumns.includes('acciones') && (
                    <th className="acciones-col">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {cuadrillas.map((cuadrilla) => (
                  <tr key={cuadrilla.id}>
                    {selectedColumns.includes('id') && <td>{cuadrilla.id}</td>}
                    {selectedColumns.includes('nombre') && <td>{cuadrilla.nombre}</td>}
                    {selectedColumns.includes('zona') && <td>{cuadrilla.zona}</td>}
                    {selectedColumns.includes('email') && <td>{cuadrilla.email}</td>}
                    {selectedColumns.includes('acciones') && (
                      <td className="action-cell">
                        <button
                          className="action-btn edit me-2"
                          onClick={() => handleEdit(cuadrilla)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(cuadrilla.id)}
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

export default Cuadrillas;