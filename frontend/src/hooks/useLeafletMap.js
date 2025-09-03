import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-rotate/dist/leaflet-rotate.js';

const useLeafletMap = (center) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      rotate: true,
      rotateControl: false,
      zoomControl: false,
      touchRotate: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      mapInstanceRef.current?.remove();
    };
  }, [center.lat, center.lng]);

  const createRoutingControl = (waypoints) => {
    if (!mapInstanceRef.current) return null;
    const control = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
      lineOptions: { styles: [{ color: '#2c2c2c', weight: 5 }] },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false,
      show: false,
      fitSelectedRoutes: false,
      containerClassName: 'hidden-routing-control'
    }).addTo(mapInstanceRef.current);

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
    });

    return control;
  };

  const rotarNorte = () => {
    mapInstanceRef.current?.setBearing(0, { animate: true });
  };

  return { mapRef, mapInstanceRef, createRoutingControl, rotarNorte };
};

export default useLeafletMap;