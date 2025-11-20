import api from './api';
import { getClientes, getClienteSucursales, createClienteSucursal } from './clienteService';

const normalizeSucursal = (sucursal, clienteNombre) => ({
  ...sucursal,
  cliente_nombre: clienteNombre ?? sucursal.cliente_nombre ?? '',
  frecuencia_preventivo: sucursal.frecuencia_preventivo ?? null,
});

export const getSucursales = async () => {
  const clientesResponse = await getClientes();
  const clientes = clientesResponse.data || [];

  const sucursales = (
    await Promise.all(
      clientes.map(async (cliente) => {
        const response = await getClienteSucursales(cliente.id);
        return (response.data || []).map((sucursal) => normalizeSucursal(sucursal, cliente.nombre));
      }),
    )
  ).flat();

  return { data: sucursales };
};

export const getSucursalesByCliente = (clienteId) =>
  getClienteSucursales(clienteId).then((response) => ({
    ...response,
    data: (response.data || []).map((sucursal) => normalizeSucursal(sucursal)),
  }));

export const getSucursal = (id) => api.get(`/sucursales/${id}`);

export const createSucursal = (clienteId, sucursal) =>
  createClienteSucursal(clienteId, {
    ...sucursal,
    cliente_id: clienteId,
    frecuencia_preventivo: sucursal.frecuencia_preventivo || null,
  });

export const updateSucursal = (id, sucursal) =>
  api.put(`/sucursales/${id}`, {
    ...sucursal,
    frecuencia_preventivo: sucursal.frecuencia_preventivo || null,
  });

export const deleteSucursal = (id) => api.delete(`/sucursales/${id}`);
