import React from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';
import useLeafletMap from '../hooks/useLeafletMap';
import useMapa from '../hooks/useMapa';
import MapaDesktop from '../components/MapaDesktop';
import MapaMobile from '../components/MapaMobile';
import '../styles/mapa.css';
import '../styles/botones_forms.css';

const defaultCenter = { lat: -31.4167, lng: -64.1833 };

const Mapa = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { mapRef, mapInstanceRef, createRoutingControl, rotarNorte } = useLeafletMap(defaultCenter);
  const {
    cuadrillas,
    users,
    sucursales,
    compassRef,
    showEncargados,
    showCuadrillas,
    showSucursales,
    isSidebarOpen,
    toggleEncargados,
    toggleCuadrillas,
    toggleSucursales,
    toggleSidebar,
    handleCuadrillaSelection,
    handleEncargadoSelection,
    handleSucursalSelection,
    setIsSidebarOpen,
  } = useMapa(mapInstanceRef, createRoutingControl, isMobile);

  return (
    <>
      {!isMobile && (
        <MapaDesktop
          mapRef={mapRef}
          compassRef={compassRef}
          rotarNorte={rotarNorte}
          toggleCuadrillas={toggleCuadrillas}
          toggleEncargados={toggleEncargados}
          toggleSucursales={toggleSucursales}
          showCuadrillas={showCuadrillas}
          showEncargados={showEncargados}
          showSucursales={showSucursales}
          cuadrillas={cuadrillas}
          users={users}
          sucursales={sucursales}
          onSelectCuadrilla={handleCuadrillaSelection}
          onSelectEncargado={handleEncargadoSelection}
          onSelectSucursal={handleSucursalSelection}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      {isMobile && (
        <MapaMobile
          mapRef={mapRef}
          compassRef={compassRef}
          rotarNorte={rotarNorte}
          toggleCuadrillas={toggleCuadrillas}
          toggleEncargados={toggleEncargados}
          toggleSucursales={toggleSucursales}
          showCuadrillas={showCuadrillas}
          showEncargados={showEncargados}
          showSucursales={showSucursales}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          cuadrillas={cuadrillas}
          users={users}
          sucursales={sucursales}
          onSelectCuadrilla={handleCuadrillaSelection}
          onSelectEncargado={handleEncargadoSelection}
          onSelectSucursal={handleSucursalSelection}
          navigate={navigate}
        />
      )}
    </>
  );
};

export default Mapa;