import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUsersLocations, getSucursalesLocations } from '../services/maps';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };;

const Mapa = () => {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState(null);
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const fetchLocations = async () => {
    try {
      const responseUsers = await getUsersLocations();
      const updatedUsers = responseUsers.data
        .map(user => ({
          id: user.id,
          name: user.name || 'Unknown',
          lat: parseFloat(user.lat),
          lng: parseFloat(user.lng)
        }))
        .filter(user => !isNaN(user.lat) && !isNaN(user.lng) && user.lat !== 0 && user.lng !== 0);
      setUsers(updatedUsers);

      const responseSucursales = await getSucursalesLocations();
      const updatedSucursales = responseSucursales.data
        .map(sucursal => ({
          id: sucursal.id,
          name: sucursal.name || 'Unknown',
          lat: parseFloat(sucursal.lat),
          lng: parseFloat(sucursal.lng)
        }))
        .filter(sucursal => !isNaN(sucursal.lat) && !isNaN(sucursal.lng) && sucursal.lat !== 0 && sucursal.lng !== 0);
      setSucursales(updatedSucursales);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Error al cargar ubicaciones');
    }
  };

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else if (currentEntity.type !== 'usuario') {
      navigate('/');
    } else {
      fetchLocations();
      const intervalId = setInterval(fetchLocations, 30000);
      return () => clearInterval(intervalId);
    }
  }, [currentEntity, navigate]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 15
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.invalidateSize();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const userMarkers = users.map(user => {
      const marker = L.marker([user.lat, user.lng], {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        title: user.name
      }).addTo(mapInstanceRef.current);
      return marker;
    });

    const sucursalMarkers = sucursales.map(sucursal => {
      const marker = L.marker([sucursal.lat, sucursal.lng], {
        icon: L.divIcon({
          html: renderToString(<FaMapMarkerAlt style={{ color: 'rgb(22, 109, 196)', fontSize: '24px' }} />),
          className: 'sucursal-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        title: sucursal.name
      }).addTo(mapInstanceRef.current);
      return marker;
    });

    if (users.length > 0 || sucursales.length > 0) {
      const bounds = L.latLngBounds([...users, ...sucursales].map(loc => [loc.lat, loc.lng]));
      mapInstanceRef.current.fitBounds(bounds);
    }

    return () => {
      userMarkers.forEach(marker => marker.remove());
      sucursalMarkers.forEach(marker => marker.remove());
    };
  }, [users, sucursales]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2>Mapa de Usuarios y Sucursales</h2>
      <div ref={mapRef} style={mapContainerStyle}></div>
    </div>
  );
};

export default Mapa;