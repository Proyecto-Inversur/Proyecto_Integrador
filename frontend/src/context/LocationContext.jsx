import React, { createContext, useEffect, useState } from 'react';
import { useAuthRoles } from '../hooks/useAuthRoles';
import { updateUserLocation } from '../services/maps';

export const LocationContext = createContext();

const LocationProvider = ({ children }) => {
  const { id, nombre } = useAuthRoles();
  const [userLocation, setUserLocation] = useState(null);
  const isE2E = typeof window !== 'undefined' && !!window.Cypress;

  useEffect(() => {
    if (!id) {
      setUserLocation(null);
      return;
    }

    if (isE2E) {
      const location = { lat: -31.4167, lng: -64.1833 };
      setUserLocation(location);
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setUserLocation(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setUserLocation(location);
        const name = nombre || 'Unknown';
        if (!isE2E) {
          updateUserLocation({ lat: latitude, lng: longitude, name })
            .catch(error => console.error('Error updating location:', error));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [id, isE2E, nombre]);

  return (
    <LocationContext.Provider value={{ userLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;
