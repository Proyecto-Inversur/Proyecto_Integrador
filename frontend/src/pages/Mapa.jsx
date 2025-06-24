import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { AuthContext } from '../context/AuthContext';
import { getLocations } from '../services/maps';
import '../styles/mapa.css';

const containerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: -34.397,
  lng: 150.644
};

const Mapa = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey
  });

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    }

    const fetchLocations = async () => {
      try {
        const response = await getLocations();
        console.log('Fetched locations:', response.data);

        const updatedUsers = response.data.map(user => ({
          id: user.id,
          name: user.name || 'Unknown',
          lat: parseFloat(user.lat),
          lng: parseFloat(user.lng)
        })).filter(user => !isNaN(user.lat) && !isNaN(user.lng) && user.lat !== 0 && user.lng !== 0);

        console.log('Parsed users:', updatedUsers);
        setUsers(updatedUsers);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError('Error al cargar ubicaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const intervalId = setInterval(fetchLocations, 30000);
    return () => clearInterval(intervalId);
  }, [currentEntity]);

  if (loading) return <div className="map-container">Cargando mapa...</div>;
  if (error) return <div className="map-container">{error}</div>;
  if (loadError) return <div className="map-container">Error al cargar Google Maps</div>;
  if (!isLoaded) return <div className="map-container">Cargando mapa de Google...</div>;

  const mapCenter = users.length > 0
    ? { lat: users[0].lat, lng: users[0].lng }
    : defaultCenter;

  return (
    <div className="map-container">
      <h2>Mapa de Usuarios</h2>
      {users.length === 0 && <p>No hay usuarios con ubicaciones disponibles</p>}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={users.length > 0 ? 12 : 2}
        onLoad={map => console.log('Map loaded:', map)}
        onUnmount={map => console.log('Map unmounted:', map)}
      >
        {users.map(user => (
          <Marker
            key={user.id}
            position={{ lat: user.lat, lng: user.lng }}
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20),
              labelOrigin: new window.google.maps.Point(60, 20)
            }}
            label={{
              text: user.name,
              color: "#000",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default Mapa;