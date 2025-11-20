import api from './api';

const normalizePreventivo = (mantenimiento) => ({
  ...mantenimiento,
  id_sucursal: mantenimiento.id_sucursal ?? mantenimiento.sucursal_id ?? null,
  sucursal_id: mantenimiento.sucursal_id ?? mantenimiento.id_sucursal ?? null,
});

const buildPreventivoPayload = (mantenimiento) => {
  const payload = { ...mantenimiento };
  payload.cliente_id = payload.cliente_id ?? payload.id_cliente ?? null;
  payload.sucursal_id = payload.sucursal_id ?? payload.id_sucursal ?? null;
  delete payload.id_cliente;
  delete payload.id_sucursal;
  return payload;
};

export const getMantenimientosPreventivos = async () => {
  const response = await api.get('/mantenimientos-preventivos/');
  return {
    ...response,
    data: (response.data || []).map(normalizePreventivo),
  };
};

export const getMantenimientoPreventivo = async (id) => {
  const response = await api.get(`/mantenimientos-preventivos/${id}`);
  return {
    ...response,
    data: normalizePreventivo(response.data),
  };
};

export const createMantenimientoPreventivo = (mantenimiento) => {
  const payload = buildPreventivoPayload(mantenimiento);
  return api.post('/mantenimientos-preventivos/', payload);
};

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
