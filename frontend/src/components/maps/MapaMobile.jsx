import React from 'react';
import MapInfoPanel from './MapInfoPanel';
import { FaTruck, FaUserAlt, FaMapMarkerAlt, FaBars } from 'react-icons/fa';
import { FiArrowLeft, FiCompass } from 'react-icons/fi';

const MapaMobile = ({
  mapRef,
  compassRef,
  rotarNorte,
  toggleCuadrillas,
  toggleEncargados,
  toggleSucursales,
  showCuadrillas,
  showEncargados,
  showSucursales,
  isSidebarOpen,
  toggleSidebar,
  cuadrillas,
  users,
  sucursales,
  clientes,
  clienteFilter,
  onClienteChange,
  zonas = [],
  zonaSucFilter = '',
  onZonaSucChange = () => {},
  zonaCuaFilter = '',
  onZonaCuaChange = () => {},
  onSelectCuadrilla,
  onSelectEncargado,
  onSelectSucursal,
  navigate,
}) => (
  <div className="ruta-container">
    <div className="ruta-main">
      <div className="container-ruta">
        <div ref={mapRef} className="ruta-map"></div>
        <div className={`map-mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <MapInfoPanel
            cuadrillas={cuadrillas}
            encargados={users}
            sucursales={sucursales}
            clientes={clientes}
            clienteFilter={clienteFilter}
            onClienteChange={onClienteChange}
            zonas={zonas}
            zonaSucFilter={zonaSucFilter}
            onZonaSucChange={onZonaSucChange}
            zonaCuaFilter={zonaCuaFilter}
            onZonaCuaChange={onZonaCuaChange}
            onSelectCuadrilla={onSelectCuadrilla}
            onSelectEncargado={onSelectEncargado}
            onSelectSucursal={onSelectSucursal}
            onClose={toggleSidebar}
          />
        </div>
        <button
          onClick={() => navigate('/')}
          className="ruta-btn danger boton-volver"
        >
          <FiArrowLeft size={28} color="white" />
        </button>
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
          className="compass compass-map"
          onClick={rotarNorte}
          aria-label="Orientar al norte"
          title="Orientar al norte"
        >
          <FiCompass className="compass-needle" size={22} />
        </div>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <FaBars size={20} color="white" />
        </button>
      </div>
    </div>
  </div>
);

export default MapaMobile;
