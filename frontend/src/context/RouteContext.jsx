import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { LocationContext } from './LocationContext';
import { getSucursalesLocations } from '../services/maps';

export const RouteContext = React.createContext();

export const RouteProvider = ({ children }) => {
  const { currentEntity } = useContext(AuthContext);
  const { userLocation } = useContext(LocationContext);
  const [selectedMantenimientos, setSelectedMantenimientos] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [error, setError] = useState(null);

  const fetchSelectedSucursales = async () => {
    if (!selectedMantenimientos.length) {
      return setSelectedSucursales([]);
    }
    try {
      const response = await getSucursalesLocations();
      const sucursales = response.data;
      const ids = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
      let filteredSucursales = sucursales.filter(sucursal => ids.includes(Number(sucursal.id)));
      
      // Sort by distance from user if location available
      if (userLocation) {
        filteredSucursales = [...filteredSucursales].sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(userLocation.lat - a.lat, 2) +
            Math.pow(userLocation.lng - a.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(userLocation.lat - b.lat, 2) +
            Math.pow(userLocation.lng - b.lng, 2)
          );
          return distA - distB;
        });
      }
      setSelectedSucursales(filteredSucursales);
    } catch (error) {
      setError('Error al cargar sucursales');
    }
  };

  useEffect(() => {
    if (currentEntity) {
      const stored = localStorage.getItem(`selectedSucursales_${currentEntity.id}`);
      if (stored) {
        setSelectedSucursales(JSON.parse(stored));
      }
    }
  }, [currentEntity]);

  useEffect(() => {
    fetchSelectedSucursales();
  }, [selectedMantenimientos, userLocation]);

  useEffect(() => {
    if (currentEntity && selectedSucursales.length) {
      localStorage.setItem(
        `selectedSucursales_${currentEntity.id}`,
        JSON.stringify(selectedSucursales)
      );
    } else if (currentEntity && !selectedSucursales.length) {
      localStorage.removeItem(`selectedSucursales_${currentEntity.id}`);
    }
  }, [selectedSucursales, currentEntity]);

  const addSucursal = (mantenimiento) => {
    setSelectedMantenimientos((prev) => [...prev, mantenimiento]);
  };

  const removeSucursal = (id) => {
    setSelectedMantenimientos((prev) => prev.filter((m) => m.id_sucursal !== id));
  };

  const clearSucursales = () => {
    setSelectedMantenimientos([]);
    setSelectedSucursales([]);
  };

  return (
    <RouteContext.Provider
      value={{ selectedSucursales, addSucursal, removeSucursal, clearSucursales, error }}
    >
      {children}
    </RouteContext.Provider>
  );
};