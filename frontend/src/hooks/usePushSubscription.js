import { useState } from 'react';
import { getPushSubscription } from '../services/firebase';
import { saveSubscription, deleteSubscription } from '../services/notificaciones';

export default function usePushSubscription() {
  const [subscription, setSubscription] = useState(null);

  const subscribe = async (firebaseUid) => {
    const pushSubscription = await getPushSubscription();
    if (pushSubscription) {
      const jsonSub = pushSubscription.toJSON();
      setSubscription(jsonSub);
      await saveSubscription({
        ...jsonSub,
        firebase_uid: firebaseUid,
        device_info: navigator.userAgent,
      });
    }
  };

  const unsubscribe = async () => {
    if (subscription?.endpoint) {
      try {
        await deleteSubscription({ params: { endpoint: subscription.endpoint } });
      } catch (e) {
        console.warn('No se pudo eliminar la suscripción de push:', e);
      }
    }
    setSubscription(null);
  };

  return { subscription, subscribe, unsubscribe };
}
