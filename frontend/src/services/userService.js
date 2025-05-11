import api from './api';

export const getUsers = () => api.get('/users/');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (user) => api.post('/auth/create-user', user);
export const updateUser = (id, user) => api.put(`/users/${id}`, user);
export const deleteUser = (id) => api.delete(`/users/${id}`);