import React, { useEffect, useState } from 'react';
import { getSucursales, deleteSucursal } from '../../services/sucursalService';

const useSucursales = () => {
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

  return { 
    sucursales, 
    showForm,
    setShowForm,
    selectedSucursal, 
    isLoading, 
    handleDelete, 
    handleEdit, 
    handleFormClose
  };
};

export default useSucursales;