import api from './api';

const normalizeCorrectivo = (mantenimiento) => ({
  ...mantenimiento,
  id_sucursal: mantenimiento.id_sucursal ?? mantenimiento.sucursal_id ?? null,
  sucursal_id: mantenimiento.sucursal_id ?? mantenimiento.id_sucursal ?? null,
});

const buildCorrectivoPayload = (mantenimiento) => {
  const payload = { ...mantenimiento };
  payload.cliente_id = payload.cliente_id ?? payload.id_cliente ?? null;
  payload.sucursal_id = payload.sucursal_id ?? payload.id_sucursal ?? null;
  delete payload.id_cliente;
  delete payload.id_sucursal;
  return payload;
};

export const getMantenimientosCorrectivos = async () => {
  const response = await api.get('/mantenimientos-correctivos/');
  return {
    ...response,
    data: (response.data || []).map(normalizeCorrectivo),
  };
};

export const getMantenimientoCorrectivo = async (id) => {
  const response = await api.get(`/mantenimientos-correctivos/${id}`);
  return {
    ...response,
    data: normalizeCorrectivo(response.data),
  };
};

export const createMantenimientoCorrectivo = (mantenimiento) => {
  const payload = buildCorrectivoPayload(mantenimiento);
  return api.post('/mantenimientos-correctivos/', payload);
};

export const updateMantenimientoCorrectivo = (id, mantenimiento) => {
  return api.put(`/mantenimientos-correctivos/${id}`, mantenimiento, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteMantenimientoCorrectivo = (id) => api.delete(`/mantenimientos-correctivos/${id}`);
export const deleteMantenimientoPlanilla = (id, fileName) => api.delete(`/mantenimientos-correctivos/${id}/planilla/${fileName}`);
export const deleteMantenimientoPhoto = (id, fileName) => api.delete(`/mantenimientos-correctivos/${id}/fotos/${fileName}`);
