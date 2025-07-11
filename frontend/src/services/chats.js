import api from './api';

export const getChatCorrectivo = (id_mantenimiento) => api.get(`/chat/correctivo/${id_mantenimiento}`);
export const getChatPreventivo = (id_mantenimiento) => api.get(`/chat/preventivo/${id_mantenimiento}`);
export const sendMessageCorrectivo = (id_mantenimiento, message) => {
  return api.post(`/chat/correctivo/${id_mantenimiento}`, message, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const sendMessagePreventivo = (id_mantenimiento, message) => {
  return api.post(`/chat/preventivo/${id_mantenimiento}`, message, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};