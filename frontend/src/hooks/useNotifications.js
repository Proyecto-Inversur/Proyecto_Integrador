import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from "react-router-dom"
import { AuthContext } from '../context/AuthContext';
import { useAuthRoles } from "../hooks/useAuthRoles"
import { get_notificaciones_correctivos, get_notificaciones_preventivos, correctivo_leido, preventivo_leido, delete_notificacion } from '../services/notificaciones';
import { subscribeToNotifications } from '../services/notificationWs';

const useNotifications = () => {
  const { logOut } = useContext(AuthContext);
  const { uid } = useAuthRoles()
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleShowNotifications = () => setShowNotifications(true)
  const handleCloseNotifications = () => setShowNotifications(false)

  const fetchNotifications = async () => {
    try {
      if (!uid) return;

      const [correctivosResp, preventivosResp] = await Promise.all([
        get_notificaciones_correctivos(uid),
        get_notificaciones_preventivos(uid)
      ]);

      const correctivos = Array.isArray(correctivosResp.data) ? correctivosResp.data : [];
      const preventivos = Array.isArray(preventivosResp.data) ? preventivosResp.data : [];

      const mappedCorrectivos = correctivos.map((notif) => ({
        ...notif,
        tipo: 'correctivo'
      }));

      const mappedPreventivos = preventivos.map((notif) => ({
        ...notif,
        tipo: 'preventivo'
      }));

      const allNotificaciones = [...mappedCorrectivos, ...mappedPreventivos];
      setUnreadCount(allNotificaciones.filter(n => !n.leida).length);

      allNotificaciones.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(allNotificaciones);
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
    }
  };

  useEffect(() => {
    if (uid) fetchNotifications();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const OPEN = typeof WebSocket !== 'undefined' ? WebSocket.OPEN : 1;
    if (socketRef.current && socketRef.current.readyState === OPEN) return;

    const onMessage = (data) => {
      setNotifications((prev) => {
        const updated = [data, ...prev];
        setUnreadCount(updated.filter((n) => !n.leida).length);
        return updated;
      });
    };

    const socket = subscribeToNotifications(uid, onMessage);
    socketRef.current = socket;

    return () => {
      const OPEN = typeof WebSocket !== 'undefined' ? WebSocket.OPEN : 1;
      if (socketRef.current?.close) {
        if (socketRef.current.readyState === OPEN) {
          socketRef.current.close();
        }
      } else if (socketRef.current?.disconnect) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [uid]);

  const disconnect = () => {
    if (socketRef.current?.close) socketRef.current.close();
    else if (socketRef.current?.disconnect) socketRef.current.disconnect();
    socketRef.current = null;
  };

  const handleLogout = async () => {
    try {
      disconnect?.()
      await logOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const timeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diff = Math.floor((now - past) / 1000)

    if (diff < 60) return `hace ${diff} seg`
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`

    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    let result = "hace "
    if (days > 0) result += `${days} d `
    if (hours > 0) result += `${hours} h `
    if (minutes > 0) result += `${minutes} min `
    if (seconds > 0) result += `${seconds} seg`
    return result.trim()
  }

  const handleClick = async (notification) => {
    if (notification.tipo === "correctivo") {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications()
      navigate("/correctivo", { state: { mantenimientoId } })
      await correctivo_leido(notification.id)
      await fetchNotifications()
    } else if (notification.tipo === "preventivo") {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications()
      navigate("/preventivo", { state: { mantenimientoId } })
      await preventivo_leido(notification.id)
      await fetchNotifications()
    }
  }

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await delete_notificacion(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const correctivosNoLeidos = notifications.filter((n) => n.tipo === "correctivo" && !n.leida)
      const preventivosNoLeidos = notifications.filter((n) => n.tipo === "preventivo" && !n.leida)

      await Promise.all([
        ...correctivosNoLeidos.map((n) => correctivo_leido(n.id)),
        ...preventivosNoLeidos.map((n) => preventivo_leido(n.id)),
      ])

      await fetchNotifications()
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error)
    }
  }

  const handleDeleteReadNotifications = async () => {
    try {
      const leidas = notifications.filter((n) => n.leida)
      await Promise.all(leidas.map((n) => delete_notificacion(n.id)))
      await fetchNotifications()
    } catch (error) {
      console.error("Error al eliminar notificaciones leídas:", error)
    }
  }

  return { 
    notifications, 
    unreadCount, 
    showNotifications, 
    handleShowNotifications, 
    handleCloseNotifications, 
    handleLogout, 
    timeAgo, 
    handleClick, 
    handleDeleteNotification, 
    handleMarkAllAsRead, 
    handleDeleteReadNotifications
  };
};

export default useNotifications;