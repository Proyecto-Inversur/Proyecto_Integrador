import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { updateUserLocation } from '../services/maps';

export const LocationContext = createContext();

const LocationProvider = ({ children }) => {
  const { currentEntity } = useContext(AuthContext);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!currentEntity) {
      setUserLocation(null);
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
        const name = currentEntity.data?.nombre || 'Unknown';
        updateUserLocation({ lat: latitude, lng: longitude, name })
          .catch(error => console.error('Error updating location:', error));
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentEntity]);

  return (
    <LocationContext.Provider value={{ userLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;