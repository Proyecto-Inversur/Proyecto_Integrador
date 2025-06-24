import api from './api';

export const getLocations = () => api.get('/maps/locations');
export const updateLocation = (location) => api.post('/maps/update-location', location);