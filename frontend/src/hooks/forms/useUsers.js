import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../../services/userService';
import { confirmDialog } from '../../components/ConfirmDialog';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
    const confirmed = await confirmDialog({
      title: 'Eliminar usuario',
      message: '¿Seguro que querés eliminar este usuario?',
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await deleteUser(id);
      fetchUsers();
      setError(null);
      setSuccess('Usuario eliminado correctamente');
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al eliminar el usuario');
      setSuccess(null);
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

  return { 
    users, 
    showForm,
    setShowForm,
    selectedUser, 
    error,
    success,
    isLoading, 
    handleDelete, 
    handleEdit, 
    handleFormClose,
    setError,
    setSuccess
  };
};

export default useUsers;
