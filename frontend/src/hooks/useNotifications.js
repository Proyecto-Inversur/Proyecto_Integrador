import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { get_notificaciones_correctivos, get_notificaciones_preventivos } from '../services/notificaciones';
import { subscribeToNotifications } from '../services/notificationWs';

const useNotifications = () => {
  const { currentEntity } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const uid = currentEntity?.data?.uid;
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
    if (currentEntity?.data?.uid) fetchNotifications();
  }, [currentEntity?.data?.uid]);

  useEffect(() => {
    const uid = currentEntity?.data?.uid;
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
      if (socketRef.current?.close) socketRef.current.close();
      else if (socketRef.current?.disconnect) socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [currentEntity?.data?.uid]);

  const disconnect = () => {
    if (socketRef.current?.close) socketRef.current.close();
    else if (socketRef.current?.disconnect) socketRef.current.disconnect();
    socketRef.current = null;
  };

  return { notifications, unreadCount, fetchNotifications, disconnect };
};

export default useNotifications;