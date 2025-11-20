import React, { useState, useEffect } from 'react';
import { getCuadrillas, deleteCuadrilla } from '../../services/cuadrillaService';
import { confirmDialog } from '../../components/ConfirmDialog';

const useCuadrillas = () => {
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCuadrilla, setSelectedCuadrilla] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
    const confirmed = await confirmDialog({
      title: 'Eliminar cuadrilla',
      message: '¿Seguro que querés eliminar esta cuadrilla?',
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await deleteCuadrilla(id);
      fetchCuadrillas();
      setError(null);
      setSuccess('Cuadrilla eliminada correctamente');
  } catch (error) {
      setError(error.response?.data?.detail || 'Error al eliminar la cuadrilla');
      setSuccess(null);
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

  return { 
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
  };
};

export default useCuadrillas;
