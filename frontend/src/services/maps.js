import api from './api';

export const getSucursalesLocations = () => api.get('/maps/sucursales-locations');
export const getUsersLocations = () => api.get('/maps/users-locations');
export const updateUserLocation = (location) => api.post('/maps/update-user-location', location);