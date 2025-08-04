import api from './api';

export const saveSubscription = (sub) => api.post('/push/subscribe', sub);
export const get_notificaciones_correctivos = (firebase_uid) => api.get(`/notificaciones/correctivos/${firebase_uid}`);
export const get_notificaciones_preventivos = (firebase_uid) => api.get(`/notificaciones/preventivos/${firebase_uid}`);
export const correctivo_leido = (id_notificacion) => api.put(`/notificaciones/correctivos/${id_notificacion}`);
export const preventivo_leido = (id_notificacion) => api.put(`/notificaciones/preventivos/${id_notificacion}`);
export const delete_notificaciones = (firebase_uid) => api.delete(`/notificaciones/${firebase_uid}`);
export const notify_nearby_maintenances = (payload) => api.post('/notificaciones/nearby', payload);
export const delete_notificacion = (id_notificacion) => api.delete(`/notificaciones/una/${id_notificacion}`);