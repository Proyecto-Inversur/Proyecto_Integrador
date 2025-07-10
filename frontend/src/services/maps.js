import api from './api';

export const getSucursalesLocations = () => api.get('/maps/sucursales-locations');
export const getUsersLocations = () => api.get('/maps/users-locations');
export const getCorrectivos = (id_cuadrilla) => api.get(`/maps/correctivo-selection/${id_cuadrilla}`);
export const getPreventivos = (id_cuadrilla) => api.get(`/maps/preventivo-selection/${id_cuadrilla}`);
export const updateUserLocation = (location) => api.post('/maps/update-user-location', location);
export const selectCorrectivo = (seleccion) => api.post('/maps/select-correctivo', seleccion);
export const selectPreventivo = (seleccion) => api.post('/maps/select-preventivo', seleccion);
export const deleteSucursal = (id_sucursal) => api.delete(`/maps/sucursal/${id_sucursal}`);
export const deleteCorrectivo = (id_mantenimiento) => api.delete(`/maps/correctivo/${id_mantenimiento}`);
export const deletePreventivo = (id_mantenimiento) => api.delete(`/maps/preventivo/${id_mantenimiento}`);
export const deleteSelection = () => api.delete('/maps/selection');