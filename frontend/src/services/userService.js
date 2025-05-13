import api from './api';

export const getUsers = () => api.get('/users/');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (user) => api.post('/auth/create-user', user);
export const updateUser = (id, user) => api.put(`/auth/update-user/${id}`, user);
export const deleteUser = (id) => api.delete(`/auth/delete-user/${id}`);