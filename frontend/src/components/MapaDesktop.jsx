import React from 'react';
import MapSidebar from './MapSidebar';
import BackButton from './BackButton';
import { FaTruck, FaUserAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { FiCompass } from 'react-icons/fi';

const MapaDesktop = ({
  mapRef,
  compassRef,
  rotarNorte,
  toggleCuadrillas,
  toggleEncargados,
  toggleSucursales,
  showCuadrillas,
  showEncargados,
  showSucursales,
  cuadrillas,
  users,
  sucursales,
  onSelectCuadrilla,
  onSelectEncargado,
  onSelectSucursal,
  setIsSidebarOpen,
}) => (
  <div className="map-container">
    <BackButton to="/" />
    <div className="contenido-wrapper">
      <div className="map-controls">
        <h2>Mapa de Usuarios y Sucursales</h2>
      </div>
      <div className="map-main">
        <MapSidebar
          cuadrillas={cuadrillas}
          encargados={users}
          sucursales={sucursales}
          onSelectCuadrilla={onSelectCuadrilla}
          onSelectEncargado={onSelectEncargado}
          onSelectSucursal={onSelectSucursal}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="container-map">
          <div ref={mapRef} className="ruta-map"></div>
          <button onClick={toggleCuadrillas} className={`cuadrillas ${showCuadrillas ? 'active' : ''}`}>
            <FaTruck size={20} color="currentColor" />
          </button>
          <button onClick={toggleEncargados} className={`encargados ${showEncargados ? 'active' : ''}`}>
            <FaUserAlt size={20} color="currentColor" />
          </button>
          <button onClick={toggleSucursales} className={`sucursales ${showSucursales ? 'active' : ''}`}>
            <FaMapMarkerAlt size={20} color="currentColor" />
          </button>
          <div
            ref={compassRef}
            className="compass"
            onClick={rotarNorte}
            aria-label="Orientar al norte"
            title="Orientar al norte"
          >
            <FiCompass className="compass-needle" size={22} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default MapaDesktop;