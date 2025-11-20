import api from './api';

export const getClientes = () => api.get('/clientes/');
export const getCliente = (id) => api.get(`/clientes/${id}`);
export const createCliente = (cliente) => api.post('/clientes/', cliente);
export const updateCliente = (id, cliente) => api.put(`/clientes/${id}`, cliente);
export const deleteCliente = (id) => api.delete(`/clientes/${id}`);
export const getClienteSucursales = (clienteId) => api.get(`/clientes/${clienteId}/sucursales`);
export const createClienteSucursal = (clienteId, sucursal) =>
  api.post(`/clientes/${clienteId}/sucursales`, { ...sucursal, cliente_id: clienteId });
