import React from 'react';
import { FiArrowLeft, FiCompass } from 'react-icons/fi';

const RutaLayout = ({
  mapRef,
  navigateHome,
  compassRef,
  rotarNorte,
  borrarRuta,
  isCenter,
  isNavigating,
  centerOnUser,
  toggleNavegacion,
}) => (
  <div className="ruta-container">
    <div className="ruta-main">
      <div className="container-ruta">
        <div ref={mapRef} className="ruta-map"></div>
        <button
          onClick={navigateHome}
          className="ruta-btn danger boton-volver"
        >
          <FiArrowLeft size={28} color="white" />
        </button>
        <div
          ref={compassRef}
          className="compass compass-ruta"
          onClick={rotarNorte}
          aria-label="Orientar al norte"
          title="Orientar al norte"
        >
          <FiCompass className="compass-needle" size={22} />
        </div>
        <button className="ruta-btn danger boton-borrar" onClick={borrarRuta}>
          ❌ Borrar ruta
        </button>
        {!isCenter && (
          <button className="ruta-btn success boton-centrar" onClick={centerOnUser}>
            Centrar
          </button>
        )}
        <button
          className={`ruta-btn ${isNavigating ? 'danger' : 'success'} boton-navegar`}
          onClick={toggleNavegacion}
        >
          {isNavigating ? 'Detener' : 'Iniciar'}
        </button>
      </div>
    </div>
  </div>
);

export default RutaLayout;