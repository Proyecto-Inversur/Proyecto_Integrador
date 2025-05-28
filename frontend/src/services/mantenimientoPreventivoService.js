import api from './api';

export const getMantenimientosPreventivos = () => api.get('/mantenimientos-preventivos/');
export const getMantenimientoPreventivo = (id) => api.get(`/mantenimientos-preventivos/${id}`);
export const createMantenimientoPreventivo = (mantenimiento) => api.post('/mantenimientos-preventivos/', mantenimiento);
export const updateMantenimientoPreventivo = (id, mantenimiento) => api.put(`/mantenimientos-preventivos/${id}`, mantenimiento);
export const deleteMantenimientoPreventivo = (id) => api.delete(`/mantenimientos-preventivos/${id}`);