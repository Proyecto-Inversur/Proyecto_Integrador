import { useState, useRef } from "react";
import L from "leaflet";

export const useRutaNavegacion = (mapInstanceRef, createRoutingControl) => {
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const routeMarkerRef = useRef(null);

  const centerOnUser = (userLocation, prevLatLngRef) => {
    if (mapInstanceRef.current && (prevLatLngRef.current || userLocation)) {
      mapInstanceRef.current.flyTo(
        prevLatLngRef.current || userLocation,
        18,
        { duration: 1 }
      );
    }
  };

  const iniciarNavegacion = (route, sucursales, userLocation, prevLatLngRef, actualizarWaypoints) => {
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) return;

    centerOnUser(userLocation, prevLatLngRef);
    setIsNavigating(true);

    const currentLatLng = prevLatLngRef.current || userLocation;
    if (currentLatLng && sucursales.length) {
      const wp = [
        L.latLng(currentLatLng.lat, currentLatLng.lng),
        ...sucursales.map((s) => L.latLng(s.lat, s.lng)),
      ];
      actualizarWaypoints(wp);
    }
  };

  const actualizarWaypoints = (waypoints) => {
    const control = routeMarkerRef.current?.control;
    try {
      if (control && control._line) {
        control.setWaypoints(waypoints);
      } else {
        const newControl = createRoutingControl(waypoints);
        routeMarkerRef.current = { control: newControl };
        setRoutingControl(newControl);
      }
    } catch (err) {
      console.error("Error actualizando waypoints:", err);
      const newControl = createRoutingControl(waypoints);
      routeMarkerRef.current = { control: newControl };
      setRoutingControl(newControl);
    }
  };

  const borrarRuta = (setSucursales, sucursalMarkersRef) => {
    if (!window.confirm("⚠️ Vas a borrar toda la selección. ¿Seguro que querés continuar?")) {
      return;
    }
    setSucursales([]);
    sucursalMarkersRef.current.forEach((marker) => marker?.remove());

    if (routeMarkerRef.current?.control) {
      try {
        mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
      } catch {}
      routeMarkerRef.current = null;
      setRoutingControl(null);
    }
  };

  return {
    routingControl,
    isNavigating,
    setIsNavigating,
    centerOnUser,
    iniciarNavegacion,
    actualizarWaypoints,
    borrarRuta,
  };
};
