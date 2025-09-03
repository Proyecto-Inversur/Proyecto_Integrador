import React from 'react';
import { useNavigate } from 'react-router-dom';
import useLeafletMap from '../hooks/useLeafletMap';
import useRuta from '../hooks/useRuta';
import RutaLayout from '../components/RutaLayout';
import '../styles/mapa.css';

const defaultCenter = { lat: -31.4167, lng: -64.1833 };

const Ruta = () => {
  const navigate = useNavigate();
  const { mapRef, mapInstanceRef, createRoutingControl } = useLeafletMap(defaultCenter);
  const {
    compassRutaRef,
    isNavigating,
    isCenter,
    centerOnUser,
    toggleNavegacion,
    borrarRuta,
    rotarNorte,
  } = useRuta(mapInstanceRef, createRoutingControl);

  return (
    <RutaLayout
      mapRef={mapRef}
      navigateHome={() => navigate('/')}
      compassRef={compassRutaRef}
      rotarNorte={rotarNorte}
      borrarRuta={borrarRuta}
      isCenter={isCenter}
      isNavigating={isNavigating}
      centerOnUser={centerOnUser}
      toggleNavegacion={toggleNavegacion}
    />
  );
};

export default Ruta;