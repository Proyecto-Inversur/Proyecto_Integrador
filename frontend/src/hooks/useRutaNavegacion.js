import { useEffect, useState, useRef } from "react";
import { deleteSelection } from '../services/maps';
import L from "leaflet";
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export const useRutaNavegacion = (mapInstanceRef, createRoutingControl) => {
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(null);

  const routeMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (!isNavigating) return;
    const handleOrientation = (event) => {
      let value;
      if (typeof event.webkitCompassHeading === 'number') {
        value = isIOS ? (360 - event.webkitCompassHeading) : event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        value = event.alpha;
      }
      if (typeof value === 'number') {
        setHeading(value);
        headingRef.current = value;
      }
    };
    const enable = async () => {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== 'granted') return;
        }
        window.addEventListener('deviceorientation', handleOrientation);
      } catch (err) {
        console.error('Device orientation error:', err);
      }
    };
    enable();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isNavigating]);

  useEffect(() => {
    if (!isNavigating || heading == null) return;
    mapInstanceRef.current?.setBearing(heading);
  }, [heading, isNavigating]);

  const centerOnUser = (userLocation, prevLatLngRef) => {
    if (mapInstanceRef.current && (prevLatLngRef.current || userLocation)) {
      mapInstanceRef.current.flyTo(
        prevLatLngRef.current || userLocation,
        18,
        { duration: 1 }
      );
    }
  };

  const iniciarNavegacion = (route, sucursales, userLocation, prevLatLngRef) => {
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
    deleteSelection();
  };

  const smoothPanTo = (targetLatLng, zoom, targetBearing) => {
    if (!mapInstanceRef.current || !targetLatLng) return;
    const map = mapInstanceRef.current;
    const startLatLng = map.getCenter();
    const startBearing = map.getBearing() || 0;
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
      let bearingDiff = targetBearing - startBearing;
      if (bearingDiff > 180) bearingDiff -= 360;
      if (bearingDiff < -180) bearingDiff += 360;
      const bearing = startBearing + bearingDiff * progress;
      const userLatLng = L.latLng(lat, lng);
      map.setView(userLatLng, zoom);
      map.setBearing(bearing);
      userMarkerRef.current?.remove();
      userMarkerRef.current = L.marker(userLatLng, {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:#2c2c2c; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(mapInstanceRef.current);
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const rotarNorte = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setBearing(0, { animate: true });
    }
    setHeading(0);
    headingRef.current = 0;
  };

  return {
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
  };
};
