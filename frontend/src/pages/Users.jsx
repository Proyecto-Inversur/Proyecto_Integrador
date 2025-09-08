import React from 'react';
import { Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import DataTable from '../components/forms/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import UserForm from '../components/forms/UserForm';
import useUsers from '../hooks/forms/useUsers';
import '../styles/botones_forms.css';

const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'acciones', label: 'Acciones' },
];

const Users = () => {
  const {
    users, 
    showForm,
    setShowForm,
    selectedUser, 
    error, 
    isLoading, 
    handleDelete, 
    handleEdit, 
    handleFormClose
  } = useUsers();

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