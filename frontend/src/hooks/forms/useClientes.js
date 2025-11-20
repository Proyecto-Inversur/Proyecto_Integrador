import React, { useEffect, useState } from 'react';
import { getClientes, deleteCliente } from '../../services/clienteService';
import { getSucursalesByCliente, deleteSucursal } from '../../services/sucursalService';
import { getColumnPreferences, saveColumnPreferences } from '../../services/preferencesService';
import { confirmDialog } from '../../components/ConfirmDialog';
import '../../styles/botones_forms.css';

const CLIENTS_PREF_KEY = 'clientes_table';
const CLIENTS_SUCURSALES_PREF_KEY = 'clientes_sucursales_table';

const clientColumns = [
  { key: 'nombre', label: 'Cliente' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const sucursalColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'frecuencia', label: 'Frecuencia preventivo' },
  { key: 'acciones', label: 'Acciones' },
];

const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error_cliente, setError_cliente] = useState(null);
  const [success_cliente, setSuccess_cliente] = useState(null);
  const [error_sucursal, setError_sucursal] = useState(null);
  const [success_sucursal, setSuccess_sucursal] = useState(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [sucursalesMap, setSucursalesMap] = useState({});
  const [activeSucursalForm, setActiveSucursalForm] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [selectedClientColumns, setSelectedClientColumns] = useState(clientColumns.map((c) => c.key));
  const [selectedSucursalColumns, setSelectedSucursalColumns] = useState(sucursalColumns.map((c) => c.key));

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [clientPrefs, sucursalPrefs] = await Promise.all([
          getColumnPreferences(CLIENTS_PREF_KEY),
          getColumnPreferences(CLIENTS_SUCURSALES_PREF_KEY),
        ]);
        const clientCols = clientPrefs.data?.columns?.length ? clientPrefs.data.columns : clientColumns.map((c) => c.key);
        const sucCols = sucursalPrefs.data?.columns?.length ? sucursalPrefs.data.columns : sucursalColumns.map((c) => c.key);
        setSelectedClientColumns(clientCols);
        setSelectedSucursalColumns(sucCols);
      } catch {
        setSelectedClientColumns(clientColumns.map((c) => c.key));
        setSelectedSucursalColumns(sucursalColumns.map((c) => c.key));
      }
    };
    loadPreferences();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await getClientes();
      setClientes(response.data || []);
      setError_cliente(null);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError_cliente('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  };

  const loadSucursales = async (clienteId) => {
    setLoadingSucursales(true);
    try {
      const response = await getSucursalesByCliente(clienteId);
      setSucursalesMap((prev) => ({ ...prev, [clienteId]: response.data || [] }));
      setError_cliente(null);
    } catch (err) {
      console.error('Error fetching sucursales:', err);
      setError_cliente('No se pudieron cargar las sucursales del cliente.');
    } finally {
      setLoadingSucursales(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleDeleteCliente = async (clienteId) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar cliente',
      message: '¿Seguro que querés eliminar este cliente y todas sus sucursales?',
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;
    try {
      await deleteCliente(clienteId);
      setExpandedCliente(null);
      await loadClientes();
      setError_cliente(null);
      setSuccess_cliente('Cliente eliminado correctamente');
    } catch (err) {
      setError_cliente(err.response?.data?.detail || 'Error al eliminar el cliente');
      setSuccess_cliente(null);
    }
  };

  const handleDeleteSucursal = async (clienteId, sucursalId) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar sucursal',
      message: '¿Seguro que querés eliminar esta sucursal?',
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;
    try {
      await deleteSucursal(sucursalId);
      await loadSucursales(clienteId);
      setError_sucursal(null);
      setSuccess_sucursal('Sucursal eliminada correctamente');
    } catch (err) {
      setError_sucursal(err.response?.data?.detail || 'Error al eliminar la sucursal');
      setSuccess_sucursal(null);
    }
  };

  const toggleClienteRow = (clienteId) => {
    if (expandedCliente === clienteId) {
      setExpandedCliente(null);
      return;
    }
    setExpandedCliente(clienteId);
    if (!sucursalesMap[clienteId]) {
      loadSucursales(clienteId);
    }
  };

  const handleOpenClienteForm = (cliente) => {
    setSelectedCliente(cliente || null);
    setShowClienteForm(true);
  };

  const handleClienteSaved = () => {
    setShowClienteForm(false);
    setSelectedCliente(null);
    loadClientes();
  };

  const handleOpenSucursalForm = (clienteId, sucursal = null) => {
    setActiveSucursalForm({ clienteId, sucursal });
  };

  const handleSucursalSaved = async (clienteId) => {
    setActiveSucursalForm(null);
    await loadSucursales(clienteId);
  };

  const handleSaveClientColumns = async (columns) => {
    setSelectedClientColumns(columns);
    try {
      await saveColumnPreferences(CLIENTS_PREF_KEY, columns);
    } catch (err) {
      console.error('Error guardando columnas de clientes', err);
    }
  };

  const handleSaveSucursalColumns = async (columns) => {
    setSelectedSucursalColumns(columns);
    try {
      await saveColumnPreferences(CLIENTS_SUCURSALES_PREF_KEY, columns);
    } catch (err) {
      console.error('Error guardando columnas de sucursales', err);
    }
  };

  return { 
    clientes,
    loading,
    error_cliente,
    error_sucursal,
    success_cliente,
    success_sucursal,
    showClienteForm,
    setShowClienteForm,
    selectedCliente,
    expandedCliente,
    sucursalesMap,
    activeSucursalForm,
    setActiveSucursalForm,
    loadingSucursales,
    selectedClientColumns,
    selectedSucursalColumns,
    handleOpenClienteForm,
    handleDeleteCliente,
    handleClienteSaved,
    toggleClienteRow,
    handleOpenSucursalForm,
    handleDeleteSucursal,
    handleSucursalSaved,
    handleSaveClientColumns,
    handleSaveSucursalColumns,
    setError_cliente,
    setError_sucursal,
    setSuccess_cliente,
    setSuccess_sucursal,
  };
};

export default useClientes;
