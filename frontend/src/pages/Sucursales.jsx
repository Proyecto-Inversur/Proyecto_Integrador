import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import SucursalForm from '../components/SucursalForm';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getSucursales, deleteSucursal } from '../services/sucursalService';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';
import ColumnSelector from '../components/ColumnSelector';
import { FaPlus } from 'react-icons/fa';
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
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.map((c) => c.key)
  );

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

  const loadPreferences = async () => {
    try {
      const response = await getColumnPreferences('sucursales');
      const cols = response.data?.columns || availableColumns.map((c) => c.key);
      if (cols.length == 0) {
        cols = ['id', 'nombre', 'zona', 'direccion', 'superficie', 'acciones'];
      }
      setSelectedColumns(cols);
    } catch {
      setSelectedColumns(availableColumns.map((c) => c.key));
    }
  };

  useEffect(() => {
    fetchSucursales();
    loadPreferences();
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

  const handleSaveColumns = async (cols) => {
    setSelectedColumns(cols);
    try {
      await saveColumnPreferences('sucursales', cols);
    } catch (e) {
      /* empty */
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
            <ColumnSelector
              availableColumns={availableColumns}
              selectedColumns={selectedColumns}
              onSave={handleSaveColumns}
            />
            <Table striped bordered hover>
              <thead>
                <tr>
                  {selectedColumns.includes('id') && <th>ID</th>}
                  {selectedColumns.includes('nombre') && <th>Nombre</th>}
                  {selectedColumns.includes('zona') && <th>Zona</th>}
                  {selectedColumns.includes('direccion') && <th>Dirección</th>}
                  {selectedColumns.includes('superficie') && <th>Superficie</th>}
                  {selectedColumns.includes('acciones') && (
                    <th className="acciones-col">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sucursales.map((sucursal) => (
                  <tr key={sucursal.id}>
                    {selectedColumns.includes('id') && <td>{sucursal.id}</td>}
                    {selectedColumns.includes('nombre') && <td>{sucursal.nombre}</td>}
                    {selectedColumns.includes('zona') && <td>{sucursal.zona}</td>}
                    {selectedColumns.includes('direccion') && (
                      <td>{sucursal.direccion}</td>
                    )}
                    {selectedColumns.includes('superficie') && (
                      <td>{sucursal.superficie}</td>
                    )}
                    {selectedColumns.includes('acciones') && (
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

export default Sucursales;