import { useEffect, useRef, useState, useContext } from "react";
import { LocationContext } from "../../context/LocationContext";
import { deleteSucursal } from "../../services/maps";
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { bearing } from "@turf/turf";
import L from "leaflet";

import { useRutaData } from "./useRutaData";
import { useRutaNavegacion } from "./useRutaNavegacion";

const ARRIVAL_RADIUS = 50;

const useRuta = (mapInstanceRef, createRoutingControl) => {
  const { userLocation } = useContext(LocationContext);

  const compassRutaRef = useRef(null);
  const prevLatLngRef = useRef(null);
  const sucursalMarkersRef = useRef([]);
  const lastSucursalIdsRef = useRef([]);
  const [isCenter, setIsCenter] = useState(true);

  const {
    sucursales,
    setSucursales,
    fetchData,
    checkNearbyMaintenances,
  } = useRutaData();

  const {
    headingRef,
    userMarkerRef,
    routingControl,
    isNavigating,
    setIsNavigating,
    centerOnUser,
    iniciarNavegacion,
    actualizarWaypoints,
    borrarRuta,
    smoothPanTo,
    rotarNorte
  } = useRutaNavegacion(mapInstanceRef, createRoutingControl);

  useEffect(() => {
    fetchData();
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (userLocation) {
      const currentLatLng = L.latLng(userLocation.lat, userLocation.lng);
      userMarkerRef.current?.remove();
      userMarkerRef.current = L.marker(currentLatLng, {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:#2c2c2c; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(mapInstanceRef.current);
    }
  }, [mapInstanceRef.current]);

  useEffect(() => {
    if (!mapInstanceRef.current || !compassRutaRef.current) return;
    const map = mapInstanceRef.current;
    const el = compassRutaRef.current;
    const updateCompass = () => {
      const angle = map.getBearing ? map.getBearing() : 0;
      const needle = el.querySelector('.compass-needle');
      if (needle) needle.style.transform = `rotate(${-angle}deg)`;
    };
    map.on('rotate', updateCompass);
    map.on('moveend', updateCompass);
    updateCompass();
    return () => {
      map.off('rotate', updateCompass);
      map.off('moveend', updateCompass);
    };
  }, []);

  useEffect(() => {
    const currentLatLng = prevLatLngRef.current || userLocation;
    if (!currentLatLng || !sucursales.length) return;
    if (!sucursalesSonIguales(sucursales, lastSucursalIdsRef.current)) {
      lastSucursalIdsRef.current = sucursales;
      const waypoints = [L.latLng(currentLatLng.lat, currentLatLng.lng), ...sucursales.map(s => L.latLng(s.lat, s.lng))];
      actualizarWaypoints(waypoints);
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current = [];
      sucursales.forEach(sucursal => {
        const marker = L.marker([sucursal.lat, sucursal.lng], {
          icon: L.divIcon({
            html: renderToString(<FaMapMarkerAlt style={{ color: '#2c2c2c', fontSize: '24px' }} />),
            className: 'sucursal-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: sucursal.name
        }).addTo(mapInstanceRef.current);
        sucursalMarkersRef.current.push(marker);
      });
    }
  }, [sucursales, isNavigating]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.on('move', () => {
      const centroActual = mapInstanceRef.current.getCenter();
      if (userLocation) {
        const distancia = centroActual.distanceTo(L.latLng(userLocation.lat, userLocation.lng));
        setIsCenter(distancia < 10);
      }
    });
  }, [userLocation]);

  useEffect(() => {
    const isE2E = typeof window !== 'undefined' && !!window.Cypress;

    if (isE2E && userLocation) {
      const { lat, lng } = userLocation;
      const currentLatLng = L.latLng(lat, lng);

      if (isNavigating) {
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

        let mapBearing = headingRef.current;
        if (mapBearing == null && prevLatLngRef.current) {
          const calc = bearing(
            [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
            [lng, lat]
          );
          mapBearing = -calc;
        }

        smoothPanTo(currentLatLng, 20, mapBearing ?? 0);
      }

      prevLatLngRef.current = currentLatLng;
      checkNearbyMaintenances(currentLatLng);
      return;
    }

    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const currentLatLng = L.latLng(latitude, longitude);

        if (isNavigating) {
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

          let mapBearing = headingRef.current;
          if (mapBearing == null && prevLatLngRef.current) {
            const calc = bearing(
              [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
              [longitude, latitude]
            );
            mapBearing = -calc;
          }
          smoothPanTo(currentLatLng, 20, mapBearing ?? 0);
        }

        prevLatLngRef.current = currentLatLng;
        checkNearbyMaintenances(currentLatLng);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, sucursales, userLocation]);


  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (routingControl) {
      iniciarNavegacion(routingControl, sucursales, userLocation, prevLatLngRef);
    }
  };

  const sucursalesSonIguales = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((s, i) => s.id === b[i]?.id);
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
