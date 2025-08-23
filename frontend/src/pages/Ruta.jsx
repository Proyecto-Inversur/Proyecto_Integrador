import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { getSucursalesLocations, getCorrectivos, getPreventivos, deleteSucursal, deleteSelection } from '../services/maps';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { notify_nearby_maintenances } from '../services/notificaciones';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FiArrowLeft, FiCompass } from 'react-icons/fi';
import { bearing } from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-geometryutil';
import 'leaflet-rotatedmarker';
import '../styles/mapa.css';

const defaultCenter = { lat: -31.4167, lng: -64.1833 };
const ARRIVAL_RADIUS = 50;
const ANIMATION_DURATION = 1000;
const NOTIFY_DISTANCE = 10000; // Distancia en metros para notificar mantenimientos cercanos

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const Ruta = () => {
  const { currentEntity } = useContext(AuthContext);
  const { userLocation } = useContext(LocationContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCenter, setIsCenter] = useState(true);
  const [heading, setHeading] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);
  const animationFrameRef = useRef(null);
  const sucursalMarkersRef = useRef([]);
  const lastSucursalIdsRef = useRef([]);
  const notifiedMaintenancesRef = useRef(new Set());
  const headingRef = useRef(null);
const compassRutaRef = useRef(null);

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
    }
  };

  const checkNearbyMaintenances = async (currentLatLng) => {
    if (!currentEntity?.data?.id || !isNavigating) return;
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
          .filter(m => m.estado === 'Pendiente')
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

  const crearRoutingControl = (waypoints) => {
    const control = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
      lineOptions: { styles: [{ color: '#2c2c2c', weight: 5 }] },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false,
      show: false
    }).addTo(mapInstanceRef.current);

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
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

  const rotarNorte = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setBearing(0, { animate: true }); // apunto al norte
    }
    setHeading(0);
    headingRef.current = 0;
  };

  const borrarRuta = () => {
    if (!window.confirm("⚠️ Vas a borrar toda la selección. ¿Seguro que querés continuar?")) {
      return;
    }
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
      zoomControl: false,
      touchRotate: true,
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
          html: `<div style="width: 15px; height: 20px; background:#2c2c2c; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
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
    if (!mapInstanceRef.current || !compassRutaRef.current) return;
    const map = mapInstanceRef.current;
    const el = compassRutaRef.current;

    const updateCompass = () => {
      const angle = map.getBearing ? map.getBearing() : 0;

      // girar la aguja al revés de la rotación del mapa
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
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return;
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
    (err) => {
      console.error('Geolocation error:', err);
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
        setIsCenter(distancia < 10); // tolerancia de 10 metros
      }
    });
  }, [userLocation]);

return (
    <div className="ruta-container">
      <div className="ruta-main">
        <div className="container-ruta">
          <div ref={mapRef} className="ruta-map"></div>
          <button
            onClick={() => navigate('/')}
            className="ruta-btn danger boton-volver"
          >
            <FiArrowLeft size={28} color="white" />
          </button>
          <div
            ref={compassRutaRef}
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
          {!isCenter && !isNavigating && (
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

};

export default Ruta;