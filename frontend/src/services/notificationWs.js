import { config } from '../config';

const getWsUrl = (uid) => {
  if (!config.API_URL) {
    console.error('Missing API URL configuration for WebSocket');
    return null;
  }
  const protocol = config.API_URL.startsWith('https') ? 'wss' : 'ws';
  const base = config.API_URL.replace(/^https?/, protocol);
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
