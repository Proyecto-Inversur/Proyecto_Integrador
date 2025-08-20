self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {
      data = {};
    }
  }
  const title = data.title || 'Notificacion';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
      if (ws.length > 0) {
        ws[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
