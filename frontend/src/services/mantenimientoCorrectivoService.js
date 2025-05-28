import api from './api';

export const getMantenimientosCorrectivos = () => api.get('/mantenimientos-correctivos/');
export const getMantenimientoCorrectivo = (id) => api.get(`/mantenimientos-correctivos/${id}`);
export const createMantenimientoCorrectivo = (mantenimiento) => api.post('/mantenimientos-correctivos/', mantenimiento);
export const updateMantenimientoCorrectivo = (id, mantenimiento) => api.put(`/mantenimientos-correctivos/${id}`, mantenimiento);
export const deleteMantenimientoCorrectivo = (id) => api.delete(`/mantenimientos-correctivos/${id}`);