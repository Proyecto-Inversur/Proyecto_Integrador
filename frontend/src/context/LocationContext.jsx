import React, { createContext, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { updateLocation } from '../services/maps';

export const LocationContext = createContext();

const LocationProvider = ({ children }) => {
  const { currentEntity } = useContext(AuthContext);

  useEffect(() => {
    if (!currentEntity) return;

    const updateUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const name = currentEntity.data.nombre || 'Unknown';
            updateLocation({ lat: latitude, lng: longitude, name })
              .catch(error => console.error('Error updating location:', error));
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true }
        );
      }
    };

    // Update location immediately and every 30 seconds
    updateUserLocation();
    const intervalId = setInterval(updateUserLocation, 30000);

    return () => clearInterval(intervalId);
  }, [currentEntity]);

  return (
    <LocationContext.Provider value={{}}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;