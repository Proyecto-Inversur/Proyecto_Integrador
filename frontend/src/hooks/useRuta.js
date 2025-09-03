import { useEffect, useRef, useState, useContext } from "react";
import { LocationContext } from "../context/LocationContext";
import { deleteSucursal, deleteSelection } from "../services/maps";
import { bearing } from "@turf/turf";
import L from "leaflet";

import { useRutaData } from "./useRutaData";
import { useRutaNavegacion } from "./useRutaNavegacion";

const ARRIVAL_RADIUS = 50;

const useRuta = (mapInstanceRef, createRoutingControl) => {
  const { userLocation } = useContext(LocationContext);

  const compassRutaRef = useRef(null);
  const userMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);
  const sucursalMarkersRef = useRef([]);

  const headingRef = useRef(null);
  const [heading, setHeading] = useState(null);
  const [isCenter, setIsCenter] = useState(true);

  // Hooks divididos
  const {
    sucursales,
    setSucursales,
    fetchData,
    checkNearbyMaintenances,
  } = useRutaData();

  const {
    routingControl,
    isNavigating,
    setIsNavigating,
    centerOnUser,
    iniciarNavegacion,
    actualizarWaypoints,
    borrarRuta,
  } = useRutaNavegacion(mapInstanceRef, createRoutingControl);

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const currentLatLng = L.latLng(latitude, longitude);

        if (isNavigating) {
          // Llegada a sucursal
          const reachedIds = sucursales
            .filter(
              (s) =>
                currentLatLng.distanceTo(L.latLng(s.lat, s.lng)) <= ARRIVAL_RADIUS
            )
            .map((s) => Number(s.id));

          if (reachedIds.length) {
            const nuevas = sucursales.filter((s) => !reachedIds.includes(Number(s.id)));
            setSucursales(nuevas);
            reachedIds.forEach((id) => deleteSucursal(id));
          }

          const nextWaypoints = [
            currentLatLng,
            ...sucursales.map((s) => L.latLng(s.lat, s.lng)),
          ];
          actualizarWaypoints(nextWaypoints);

          // Bearing
          let mapBearing = headingRef.current;
          if (mapBearing == null && prevLatLngRef.current) {
            const calc = bearing(
              [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
              [longitude, latitude]
            );
            mapBearing = -calc;
          }

          mapInstanceRef.current.setView(currentLatLng, 20);
          mapInstanceRef.current.setBearing(mapBearing ?? 0);
        }

        prevLatLngRef.current = currentLatLng;
        checkNearbyMaintenances(currentLatLng);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, sucursales]);

  // Helpers
  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (routingControl) {
      iniciarNavegacion(routingControl, sucursales, userLocation, prevLatLngRef, actualizarWaypoints);
    }
  };

  const rotarNorte = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setBearing(0, { animate: true });
    }
    setHeading(0);
    headingRef.current = 0;
  };

  return {
    sucursales,
    compassRutaRef,
    isNavigating,
    isCenter,
    centerOnUser: () => centerOnUser(userLocation, prevLatLngRef),
    toggleNavegacion,
    rotarNorte,
    borrarRuta: () => borrarRuta(setSucursales, sucursalMarkersRef),
  };
};

export default useRuta;
