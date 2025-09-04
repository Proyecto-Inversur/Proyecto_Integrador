import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMantenimientosPreventivos, deleteMantenimientoPreventivo } from '../../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../../services/cuadrillaService';
import { getSucursales } from '../../services/sucursalService';
import { getZonas } from '../../services/zonaService';
import { useAuthRoles } from '../useAuthRoles';

const useMantenimientoPreventivo = () => {
  const { id, isUser, isCuadrilla } = useAuthRoles();
  const [mantenimientos, setMantenimientos] = useState([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const [filters, setFilters] = useState({
      cuadrilla: '',
      sucursal: '',
      zona: '',
      sortByDate: 'desc',
    });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const fetchMantenimientos = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientosPreventivos();
      const mantenimientoArray = isCuadrilla
        ? response.data.filter(m => m.id_cuadrilla === id && m.fecha_cierre === null)
        : response.data;
      setMantenimientos(mantenimientoArray);
      setFilteredMantenimientos(mantenimientoArray);
    } catch (error) {
      console.error('Error fetching mantenimientos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [cuadrillasResponse, sucursalesResponse, zonasResponse] = await Promise.all([
        getCuadrillas(),
        getSucursales(),
        getZonas(),
      ]);
      const sucursalesConMantenimientos = sucursalesResponse.data.filter(sucursal =>
        mantenimientos.some(m => m.id_sucursal === sucursal.id)
      );

      setSucursales(sucursalesConMantenimientos);
      setCuadrillas(cuadrillasResponse.data);
      setZonas(zonasResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
  }, []);

  useEffect(() => {
    fetchData();
  }, [mantenimientos]);

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);

    let filtered = [...mantenimientos];

    if (newFilters.cuadrilla) {
      filtered = filtered.filter(m => m.id_cuadrilla === parseInt(newFilters.cuadrilla));
    }
    if (newFilters.sucursal) {
      filtered = filtered.filter(m => m.id_sucursal === parseInt(newFilters.sucursal));
    }
    if (newFilters.zona) {
      filtered = filtered.filter(m => {
        const sucursal = sucursales.find(s => s.id === m.id_sucursal);
        return sucursal?.zona?.toLowerCase() === newFilters.zona.toLowerCase();
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_apertura);
      const dateB = new Date(b.fecha_apertura);
      return newFilters.sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredMantenimientos(filtered);
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    if (isUser) {
      try {
        await deleteMantenimientoPreventivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleRowClick = (mantenimientoId) => {
    navigate('/preventivo', { state: { mantenimientoId } });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  return { 
    filteredMantenimientos,
    sucursales,
    cuadrillas,
    zonas,
    showForm,
    setShowForm,
    selectedMantenimiento,
    filters,
    isLoading,
    handleFilterChange,
    handleDelete,
    handleEdit,
    handleRowClick,
    handleFormClose,
    getSucursalNombre,
    getCuadrillaNombre,
    getZonaNombre,
    isUser
  };
};

export default useMantenimientoPreventivo;