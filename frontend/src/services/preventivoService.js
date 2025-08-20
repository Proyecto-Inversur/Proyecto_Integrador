import api from './api';

export const getPreventivos = () => api.get('/preventivos/');
export const getPreventivo = (id) => api.get(`/preventivos/${id}`);
export const createPreventivo = (preventivo) => api.post('/preventivos/', preventivo);
export const updatePreventivo = (id, preventivo) => api.put(`/preventivos/${id}`, preventivo);
export const deletePreventivo = (id) => api.delete(`/preventivos/${id}`);