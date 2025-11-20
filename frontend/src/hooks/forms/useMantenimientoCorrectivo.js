import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMantenimientosCorrectivos, deleteMantenimientoCorrectivo } from '../../services/mantenimientoCorrectivoService';
import { getSucursales } from '../../services/sucursalService';
import { getCuadrillas } from '../../services/cuadrillaService';
import { getZonas } from '../../services/zonaService';
import { useAuthRoles } from '../useAuthRoles';
import { getClientes } from '../../services/clienteService';
import { confirmDialog } from '../../components/ConfirmDialog';

const useMantenimientoCorrectivo = () => {
  const { id, isUser, isCuadrilla } = useAuthRoles();
  const [mantenimientos, setMantenimientos] = useState([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const [filters, setFilters] = useState({
    cliente: '',
    cuadrilla: '',
    sucursal: '',
    zona: '',
    rubro: '',
    estado: '',
    prioridad: '',
    sortByDate: 'desc',
  });
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMantenimientos = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientosCorrectivos();
      const mantenimientoArray = isCuadrilla
        ? response.data.filter(m => m.id_cuadrilla === id && m.estado !== 'Finalizado')
        : response.data;
      setMantenimientos(mantenimientoArray);
      setFilteredMantenimientos(mantenimientoArray);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al cargar los mantenimientos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [clientesResponse, sucursalesResponse, cuadrillasResponse, zonasResponse] = await Promise.all([
        getClientes(),
        getSucursales(),
        getCuadrillas(),
        getZonas(),
      ]);

      setClientes(clientesResponse.data || []);
      setSucursales(sucursalesResponse.data || []);
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

    if (newFilters.cliente) {
      filtered = filtered.filter((m) => String(m.cliente_id || m.id_cliente) === newFilters.cliente);
    }
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
    if (newFilters.rubro) {
      filtered = filtered.filter(m => m.rubro.toLowerCase() === newFilters.rubro.toLowerCase());
    }
    if (newFilters.estado) {
      filtered = filtered.filter(m => m.estado.toLowerCase() === newFilters.estado.toLowerCase());
    }
    if (newFilters.prioridad) {
      filtered = filtered.filter(m => m.prioridad.toLowerCase() === newFilters.prioridad.toLowerCase());
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_apertura);
      const dateB = new Date(b.fecha_apertura);
      return newFilters.sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredMantenimientos(filtered);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar correctivo',
      message: '¿Seguro que querés eliminar este mantenimiento correctivo?',
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;
    setIsLoading(true);
    if (isUser) {
      try {
        await deleteMantenimientoCorrectivo(id);
        fetchMantenimientos();
        setError(null);
        setSuccess('Mantenimiento eliminado correctamente');
      } catch (error) {
        setError(error.response?.data?.detail || 'Error al eliminar el mantenimiento');
        setSuccess(null);
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
    navigate('/correctivo', { state: { mantenimientoId } });
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
    return cuadrilla ? cuadrilla.nombre : 'No Hay Cuadrilla asignada';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  const getClienteNombre = (cliente_id) => {
    const cliente = clientes.find((c) => c.id === cliente_id);
    return cliente ? cliente.nombre : 'Sin cliente';
  };

  return { 
    filteredMantenimientos,
    clientes,
    sucursales,
    cuadrillas,
    zonas,
    showForm,
    setShowForm,
    selectedMantenimiento,
    filters,
    error,
    success,
    isLoading,
    handleFilterChange,
    handleDelete,
    handleEdit,
    handleRowClick,
    handleFormClose,
    getSucursalNombre,
    getCuadrillaNombre,
    getZonaNombre,
    getClienteNombre,
    isUser,
    setError,
    setSuccess
  };
};

export default useMantenimientoCorrectivo;
