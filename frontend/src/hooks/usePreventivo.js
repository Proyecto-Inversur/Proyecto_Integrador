import { useState, useEffect } from 'react';
import { updateMantenimientoPreventivo, deleteMantenimientoPhoto, getMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { getPreventivos, selectPreventivo, deletePreventivo } from '../services/maps';
import { getChatPreventivo, sendMessagePreventivo } from '../services/chats';
import { useAuthRoles } from '../hooks/useAuthRoles';
import useIsMobile from '../hooks/useIsMobile';
import useChat from './useChat';
import useMantenimientos from './useMantenimientos';

const usePreventivo = (mantenimientoId) => {
  const { id, uid, nombre, isUser } = useAuthRoles();
  const [mantenimiento, setMantenimiento] = useState({});
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formData, setFormData] = useState({
    planillas: [],
    fotos: [],
    fecha_cierre: null,
    extendido: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [previewArchivoAdjunto, setPreviewArchivoAdjunto] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { chatBoxRef, scrollToBottom } = useChat(mantenimiento.id, setMensajes);
  const isMobile = useIsMobile();

  const handleAddToRoute = () => {
    const seleccion = { id_mantenimiento: mantenimiento.id, id_sucursal: mantenimiento.id_sucursal };
    selectPreventivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deletePreventivo(mantenimiento.id);
    setSuccess('Mantenimiento eliminado de la ruta.');
  };

  const common = useMantenimientos(sucursales, cuadrillas, isSelected, setIsSelected, handleAddToRoute, handleRemoveFromRoute);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoPreventivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planillas: [],
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || null,
        extendido: response.data.extendido || null,
      });
      await cargarMensajes(response.data.id);
    } catch (error) {
      console.error('Error fetching mantenimiento:', error);
      setError('Error al cargar los datos actualizados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cuadrillasResponse, sucursalesResponse, preventivosResponse] = await Promise.all([
        getCuadrillas(),
        getSucursales(),
        getPreventivos(parseInt(id)),
      ]);
      setCuadrillas(cuadrillasResponse.data);
      setSucursales(sucursalesResponse.data);
      const preventivoId = preventivosResponse.data.filter(p => p.id_mantenimiento === mantenimientoId);
      if (preventivoId.length) {
        setIsSelected(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimiento();
    fetchData();
  }, []);

  const handlePhotoUpload = (files) => {
    setFormData({ ...formData, fotos: files });
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handleDeleteSelectedPhotos = async (photos) => {
    setIsLoading(true);
    try {
      for (const photoUrl of photos) {
        const fileName = photoUrl.split('/').pop();
        await deleteMantenimientoPhoto(mantenimiento.id, fileName);
      }
      setSuccess('Fotos eliminadas correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting photos:', error);
      setError('Error al eliminar las fotos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e, overrideData = null) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const data = overrideData || formData;

    const formDataToSend = new FormData();
    data.planillas.forEach(file => formDataToSend.append('planillas', file));
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (data.fecha_cierre) {
      formDataToSend.append('fecha_cierre', data.fecha_cierre);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }

    try {
      await updateMantenimientoPreventivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planillas: [], fotos: [], fecha_cierre: '', extendido: '' });
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al actualizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    const hasPlanilla = mantenimiento.planillas?.length > 0;
    const hasFoto = mantenimiento.fotos?.length > 0;

    if (!hasPlanilla || !hasFoto) {
      setError('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
      return;
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const updatedFormData = {
        ...formData,
        fecha_cierre: formattedDate,
      };
      await handleSubmit({ preventDefault: () => {} }, updatedFormData);
      setSuccess('Mantenimiento marcado como finalizado correctamente.');
    } catch (error) {
      console.error('Error marking as finished:', error);
      setError('Error al marcar como finalizado.');
    }
  };

  const cargarMensajes = async (id) => {
    try {
      const response = await getChatPreventivo(id);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje && !archivoAdjunto) return;

    const formDataMsg = new FormData();
    formDataMsg.append('firebase_uid', uid);
    formDataMsg.append('nombre_usuario', nombre);
    if (nuevoMensaje) formDataMsg.append('texto', nuevoMensaje);
    if (archivoAdjunto) formDataMsg.append('archivo', archivoAdjunto);

    try {
      await sendMessagePreventivo(mantenimiento.id, formDataMsg);
      setNuevoMensaje('');
      setArchivoAdjunto(null);
      setPreviewArchivoAdjunto(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError('No se pudo enviar el mensaje');
    }
  };

  return {
    uid,
    isUser,
    mantenimiento,
    cuadrillas,
    sucursales,
    formData,
    error,
    success,
    isLoading,
    isSelected,
    mensajes,
    nuevoMensaje,
    archivoAdjunto,
    previewArchivoAdjunto,
    isChatOpen,
    chatBoxRef,
    setNuevoMensaje,
    setArchivoAdjunto,
    setPreviewArchivoAdjunto,
    setIsChatOpen,
    handlePhotoUpload,
    handleExtendidoChange,
    handleDeleteSelectedPhotos,
    handleSubmit,
    handleFinish,
    handleEnviarMensaje,
    fetchMantenimiento,
    setFormData,
    setIsLoading,
    setSuccess,
    setError,
    ...common,
    isMobile,
  };
};

export default usePreventivo;