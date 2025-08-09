import { API_URL } from '../config';

const getWsUrl = (uid) => {
  if (!API_URL) {
    console.error('Missing API URL configuration for WebSocket');
    return null;
  }
  const protocol = API_URL.startsWith('https') ? 'wss' : 'ws';
  const base = API_URL.replace(/^https?/, protocol);
  return `${base}/ws/notificaciones/${uid}`;
};

export const subscribeToNotifications = (uid, onMessage) => {
  const url = getWsUrl(uid);
  if (!url) return null;

  const socket = new WebSocket(url);
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('Failed to parse WebSocket message', err);
    }
  };
  return socket;
};
