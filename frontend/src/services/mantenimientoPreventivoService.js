import api from './api';

export const getMantenimientosPreventivos = () => api.get('/mantenimientos-preventivos/');
export const getMantenimientoPreventivo = (id) => api.get(`/mantenimientos-preventivos/${id}`);
export const createMantenimientoPreventivo = (mantenimiento) => api.post('/mantenimientos-preventivos/', mantenimiento);
export const updateMantenimientoPreventivo = (id, mantenimiento) => {
  return api.put(`/mantenimientos-preventivos/${id}`, mantenimiento, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteMantenimientoPreventivo = (id) => api.delete(`/mantenimientos-preventivos/${id}`);
export const deleteMantenimientoPlanilla = (id, fileName) => api.delete(`/mantenimientos-preventivos/${id}/planillas/${fileName}`);
export const deleteMantenimientoPhoto = (id, fileName) => api.delete(`/mantenimientos-preventivos/${id}/fotos/${fileName}`);