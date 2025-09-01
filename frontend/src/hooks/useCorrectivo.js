import { useState, useEffect } from 'react';
import { updateMantenimientoCorrectivo, deleteMantenimientoPhoto, getMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getCorrectivos, selectCorrectivo, deleteCorrectivo } from '../services/maps';
import { getChatCorrectivo, sendMessageCorrectivo } from '../services/chats';
import { useAuthRoles } from '../hooks/useAuthRoles';
import useIsMobile from '../hooks/useIsMobile';
import useChat from './useChat';
import useMantenimientos from './useMantenimientos';

const useCorrectivo = (mantenimientoId) => {
  const { id, uid, nombre, isUser, isCuadrilla } = useAuthRoles();
  const [mantenimiento, setMantenimiento] = useState({});
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    planilla: '',
    fotos: [],
    fecha_cierre: '',
    extendido: '',
    estado: '',
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
    selectCorrectivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deleteCorrectivo(mantenimiento.id);
    setSuccess('Mantenimiento eliminado de la ruta.');
  };

  const common = useMantenimientos(sucursales, cuadrillas, isSelected, setIsSelected, handleAddToRoute, handleRemoveFromRoute);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoCorrectivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planilla: '',
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || '',
        extendido: response.data.extendido || '',
        estado: response.data.estado,
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
      const [sucursalesResponse, cuadrillasResponse, correctivosResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
        getCorrectivos(parseInt(id)),
      ]);
      setSucursales(sucursalesResponse.data);
      setCuadrillas(cuadrillasResponse.data);
      const correctivoId = correctivosResponse.data.filter(c => c.id_mantenimiento === mantenimientoId);
      if (correctivoId.length) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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

    let fechaCierreFinal = data.fecha_cierre;
    if (!fechaCierreFinal && (data.estado === 'Finalizado' || data.estado === 'Solucionado')) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      fechaCierreFinal = `${year}-${month}-${day}`;
    }

    const formDataToSend = new FormData();
    if (data.planilla) {
      formDataToSend.append('planilla', data.planilla);
    }
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (fechaCierreFinal) {
      formDataToSend.append('fecha_cierre', fechaCierreFinal);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }
    if (data.estado) {
      formDataToSend.append('estado', data.estado);
    }

    try {
      await updateMantenimientoCorrectivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planilla: '', fotos: [], fecha_cierre: '', extendido: '', estado: '' });
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al actualizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    const hasPlanilla = mantenimiento.planilla !== '';
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
        estado: 'Solucionado',
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
      const response = await getChatCorrectivo(id);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje && !archivoAdjunto) return;

    const message = new FormData();
    message.append('firebase_uid', uid);
    message.append('nombre_usuario', nombre);
    if (nuevoMensaje) message.append('texto', nuevoMensaje);
    if (archivoAdjunto) message.append('archivo', archivoAdjunto);

    try {
      await sendMessageCorrectivo(mantenimiento.id, message);
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
    isCuadrilla,
    mantenimiento,
    sucursales,
    cuadrillas,
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
    handleChange,
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

export default useCorrectivo;