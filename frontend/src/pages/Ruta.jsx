import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { getSucursalesLocations, getCorrectivos, getPreventivos, deleteSucursal, deleteSelection } from '../services/maps';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { notify_nearby_maintenances } from '../services/notificaciones';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { bearing } from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-geometryutil';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };
const ARRIVAL_RADIUS = 50;
const ANIMATION_DURATION = 1000;
const NOTIFY_DISTANCE = 10000; // Distancia en metros para notificar mantenimientos cercanos

const Ruta = () => {
  const { currentEntity } = useContext(AuthContext);
  const { userLocation } = useContext(LocationContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);
  const animationFrameRef = useRef(null);
  const sucursalMarkersRef = useRef([]);
  const lastSucursalIdsRef = useRef([]);
  const notifiedMaintenancesRef = useRef(new Set());


  const fetchData = async () => {
    if (!currentEntity?.data?.id || !userLocation) return;
    try {
      const [sucursalesResponse, correctivosResponse, preventivosResponse] = await Promise.all([
        getSucursalesLocations(),
        getCorrectivos(parseInt(currentEntity.data.id)),
        getPreventivos(parseInt(currentEntity.data.id))
      ]);
      const allSucursales = sucursalesResponse.data;
      const correctivoIds = correctivosResponse.data || [];
      const preventivoIds = preventivosResponse.data || [];
      const selectedSucursalIds = new Set([
        ...correctivoIds.map(item => Number(item.id_sucursal)),
        ...preventivoIds.map(item => Number(item.id_sucursal))
      ]);
      let filteredSucursales = allSucursales.filter(s => selectedSucursalIds.has(Number(s.id)))
      if (userLocation) {
        filteredSucursales = [...filteredSucursales].sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(userLocation.lat - a.lat, 2) +
            Math.pow(userLocation.lng - a.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(userLocation.lat - b.lat, 2) +
            Math.pow(userLocation.lng - b.lng, 2)
          );
          return distA - distB;
        });
      }
      setSucursales(filteredSucursales);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    }
  };

  const checkNearbyMaintenances = async (currentLatLng) => {
    if (!currentEntity?.data?.id) return;
    try {
      const [sucursalesResponse, allCorrectivosRes, allPreventivosRes, selectedCorrectivosRes, selectedPreventivosRes] = await Promise.all([
        getSucursalesLocations(),
        getMantenimientosCorrectivos(),
        getMantenimientosPreventivos(),
        getCorrectivos(parseInt(currentEntity.data.id)),
        getPreventivos(parseInt(currentEntity.data.id))
      ]);

      const selectedIds = new Set([
        ...selectedCorrectivosRes.data.map(c => c.id_mantenimiento),
        ...selectedPreventivosRes.data.map(p => p.id_mantenimiento)
      ]);

      const nearbySucursalIds = new Set(
        sucursalesResponse.data
          .filter(s => currentLatLng.distanceTo(L.latLng(s.lat, s.lng)) <= NOTIFY_DISTANCE)
          .map(s => Number(s.id))
      );

      const allMaintenances = [
        ...allCorrectivosRes.data
          .filter(m => m.estado === 'pendiente')
          .map(m => ({ ...m, tipo: 'correctivo' })),
        ...allPreventivosRes.data
          .filter(m => !m.fechaCierre)
          .map(m => ({ ...m, tipo: 'preventivo' }))
      ];

      const nearMaintenances = allMaintenances.filter(m =>
        m.id_cuadrilla === parseInt(currentEntity.data.id) &&
        nearbySucursalIds.has(m.id_sucursal) &&
        !selectedIds.has(m.id)
      );

      const payload = [];
      nearMaintenances.forEach(m => {
        const key = `${m.tipo}-${m.id}`;
        if (notifiedMaintenancesRef.current.has(key)) return;
        const suc = sucursalesResponse.data.find(s => Number(s.id) === m.id_sucursal);
        payload.push({ id: m.id, tipo: m.tipo, mensaje: `Mantenimiento ${m.tipo} pendiente cercano en la sucursal: ${suc ? suc.name : m.id_sucursal}` });
        notifiedMaintenancesRef.current.add(key);
      });

      if (payload.length) {
        await notify_nearby_maintenances({ mantenimientos: payload });
      }
    } catch (err) {
      console.error('Error checking nearby maintenances:', err);
    }
  };

  const centerOnUser = () => {
    if (mapInstanceRef.current && (prevLatLngRef.current || userLocation)) {
      mapInstanceRef.current.flyTo(prevLatLngRef.current || userLocation, 18, { duration: 1 });
    } else {
      console.log('Cannot center: map or user location not available');
    }
  };

  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (routingControl) {
      iniciarNavegacion(routingControl);
    } else {
      console.log('Cannot start navigation: no routing control');
    }
  };

  const iniciarNavegacion = (route) => {
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) {
      console.log('Not enough waypoints to navigate');
      return;
    }

    centerOnUser();
    setIsNavigating(true);

    const currentLatLng = prevLatLngRef.current || userLocation;
    if (currentLatLng && sucursales.length) {
      const wp = [L.latLng(currentLatLng.lat, currentLatLng.lng), ...sucursales.map(s => L.latLng(s.lat, s.lng))];
      actualizarWaypoints(wp);
    }
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
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
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

  const crearRoutingControl = (waypoints) => {
    const control = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
      lineOptions: { styles: [{ color: '#3399FF', weight: 5 }] },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false,
      show: false
    }).addTo(mapInstanceRef.current);

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
      setError('Error al calcular la ruta');
    });

    routeMarkerRef.current = { control };
    setRoutingControl(control);
  };

  const actualizarWaypoints = (waypoints) => {
    const control = routeMarkerRef.current?.control;

    try {
      if (control && control._line) {
        control.setWaypoints(waypoints);
      } else {
        crearRoutingControl(waypoints);
      }
    } catch (err) {
      console.error("Error actualizando waypoints:", err);
      crearRoutingControl(waypoints);
    }
  };

  const sucursalesSonIguales = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((s, i) => s.id === b[i]?.id);
  };

  const borrarRuta = () => {
    setSucursales([]);
    sucursalMarkersRef.current.forEach(marker => marker?.remove());
    if (routeMarkerRef.current?.control) {
      try {
        mapInstanceRef.current.removeControl(routeMarkerRef.current.control);
      } catch (e) {
        console.warn('Error al eliminar routing control:', e);
      }
      routeMarkerRef.current = null;
      setRoutingControl(null);
    }
    deleteSelection();
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: userLocation || defaultCenter,
      zoom: 12,
      rotate: true,
      rotateControl: false,
    });
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(map);

    if (userLocation) {
      const currentLatLng = L.latLng(userLocation.lat, userLocation.lng);
      userMarkerRef.current?.remove();
      userMarkerRef.current = L.marker(currentLatLng, {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(map);
    }

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return setError('Geolocalización no disponible');
    }

    const watchId = navigator.geolocation.watchPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      const currentLatLng = L.latLng(latitude, longitude);

      if (isNavigating) {
        const reachedSucursalIds = sucursales
          .filter(sucursal => currentLatLng.distanceTo(L.latLng(sucursal.lat, sucursal.lng)) <= ARRIVAL_RADIUS)
          .map(sucursal => Number(sucursal.id));

        if (reachedSucursalIds.length) {
          const nuevasSucursales = sucursales.filter(s => !reachedSucursalIds.includes(Number(s.id)));
          setSucursales(nuevasSucursales);
          reachedSucursalIds.forEach(id => deleteSucursal(id));
        }

        const nextWaypoints = [currentLatLng, ...sucursales.map(s => L.latLng(s.lat, s.lng))];
        actualizarWaypoints(nextWaypoints);

        // Movimiento suave
        let heading = 0;
        if (prevLatLngRef.current) {
          heading = bearing(
            [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
            [longitude, latitude]
          );
        }
        smoothPanTo(currentLatLng, 20, -heading);
      }

      prevLatLngRef.current = currentLatLng;
      checkNearbyMaintenances(currentLatLng);
    },
    (err) => {
      console.error('Geolocation error:', err);
      setError('No se pudo obtener la ubicación');
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating]);

  useEffect(() => {
    fetchData();
  }, [currentEntity]);

  useEffect(() => {
    const currentLatLng = prevLatLngRef.current || userLocation;
    if (!currentLatLng || !sucursales.length) return;

    if (!sucursalesSonIguales(sucursales, lastSucursalIdsRef.current)) {
      lastSucursalIdsRef.current = sucursales;

      const waypoints = [L.latLng(currentLatLng.lat, currentLatLng.lng), ...sucursales.map(s => L.latLng(s.lat, s.lng))];
      actualizarWaypoints(waypoints);

      // Limpiar y volver a agregar los marcadores
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current = [];
      sucursales.forEach(sucursal => {
        const marker = L.marker([sucursal.lat, sucursal.lng], {
          icon: L.divIcon({
            html: renderToString(<FaMapMarkerAlt style={{ color: 'rgb(22, 109, 196)', fontSize: '24px' }} />),
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

return (
    <div className="ruta-container">
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="ruta-controls">
        <button className="ruta-btn primary" onClick={centerOnUser}>
          📍 Centrar en mi ubicación
        </button>
        <button
          className={`ruta-btn ${isNavigating ? 'danger' : 'success'}`}
          onClick={toggleNavegacion}
        >
          {isNavigating ? '🛑 Detener navegación' : '🚗 Iniciar navegación'}
        </button>
        <button className="ruta-btn danger" onClick={borrarRuta}>
          ❌ Borrar ruta
        </button>
      </div>

      <div className="ruta-main">
        <div className="ruta-sidebar">
          <h5>Obras Seleccionadas</h5>
          {sucursales.length === 0 && <p>No hay obras seleccionadas.</p>}
          {sucursales.map((sucursal, idx) => (
            <div
              key={idx}
              className="obra-item"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([sucursal.lat, sucursal.lng], 18, { duration: 1 });
                }
              }}
            >
              <strong>{sucursal.name}</strong>
              <div>Lat: {sucursal.lat.toFixed(4)}</div>
              <div>Lng: {sucursal.lng.toFixed(4)}</div>
            </div>
          ))}
        </div>

        <div className="ruta-map-container">
          <div ref={mapRef} className="ruta-map"></div>
        </div>
      </div>
    </div>
  );

};

export default Ruta;