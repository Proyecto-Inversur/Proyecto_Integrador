import api from './api';

export const getCuadrillas = () => api.get('/cuadrillas/');
export const getCuadrilla = (id) => api.get(`/cuadrillas/${id}`);
export const createCuadrilla = (cuadrilla) => api.post('/auth/create-cuadrilla', cuadrilla);
export const updateCuadrilla = (id, cuadrilla) => api.put(`/auth/update-cuadrilla/${id}`, cuadrilla);
export const deleteCuadrilla = (id) => api.delete(`/auth/delete-cuadrilla/${id}`);