import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col, Alert } from 'react-bootstrap';
import UserForm from '../components/UserForm';
import { getUsers, deleteUser } from '../services/userService';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
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

  useEffect(() => {
    fetchUsers();
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

  return (
    <Container className="custom-container">
      {isLoading ? (
        <LoadingSpinner />
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
          <DataTable
            columns={availableColumns}
            data={users}
            entityKey="users"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </Container>
  );
};

export default Users;