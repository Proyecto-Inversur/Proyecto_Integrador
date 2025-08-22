import api from './api';

export const getColumnPreferences = (page) => api.get(`/preferences/${page}`);

export const saveColumnPreferences = (page, columns) =>
  api.put(`/preferences/${page}`, { columns });

export default {
  getColumnPreferences,
  saveColumnPreferences,
};