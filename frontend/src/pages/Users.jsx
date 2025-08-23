import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import UserForm from '../components/UserForm';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getUsers, deleteUser } from '../services/userService';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';
import ColumnSelector from '../components/ColumnSelector';
import { FaPlus } from 'react-icons/fa';
import '../styles/botones_forms.css';

const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'acciones', label: 'Acciones' },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.map((c) => c.key)
  );

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await getColumnPreferences('users');
      const cols = response.data?.columns || availableColumns.map((c) => c.key);
      if (cols.length == 0) {
        cols = ['id', 'nombre', 'email', 'rol', 'acciones'];
      }
      setSelectedColumns(cols);
    } catch {
      setSelectedColumns(availableColumns.map((c) => c.key));
    }
  };

  useEffect(() => {
    fetchUsers();
    loadPreferences();
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await deleteUser(id);
      fetchUsers();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al eliminar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const handleSaveColumns = async (cols) => {
    setSelectedColumns(cols);
    try {
      await saveColumnPreferences('users', cols);
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
              <h2>Gestión de Usuarios</h2>
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
            <UserForm
              user={selectedUser}
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
                  {selectedColumns.includes('email') && <th>Email</th>}
                  {selectedColumns.includes('rol') && <th>Rol</th>}
                  {selectedColumns.includes('acciones') && (
                    <th className="acciones-col">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    {selectedColumns.includes('id') && <td>{user.id}</td>}
                    {selectedColumns.includes('nombre') && <td>{user.nombre}</td>}
                    {selectedColumns.includes('email') && <td>{user.email}</td>}
                    {selectedColumns.includes('rol') && <td>{user.rol}</td>}
                    {selectedColumns.includes('acciones') && (
                      <td className="action-cell">
                        <button
                          className="action-btn edit me-2"
                          onClick={() => handleEdit(user)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(user.id)}
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

export default Users;