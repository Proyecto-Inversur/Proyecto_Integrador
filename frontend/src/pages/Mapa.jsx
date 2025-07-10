import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUsersLocations, getSucursalesLocations, getCorrectivos, getPreventivos } from '../services/maps';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };

const Mapa = () => {
  const [users, setUsers] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalesLocations, setSucursalesLocations] = useState([]);
  const [correctivos, setCorrectivos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [error, setError] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayersRef = useRef({});
  const usersMarkersRef = useRef([]);
  const sucursalMarkersRef = useRef([]);

  const fetchData = async () => {
    try {
      const [usersResponse, sucursalesResponse, correctivosResponse, preventivosResponse] = await Promise.all([
        getUsersLocations(),
        getSucursalesLocations(),
        getMantenimientosCorrectivos(),
        getMantenimientosPreventivos()
      ]);
      setCuadrillas(usersResponse.data || []);
      setSucursalesLocations(sucursalesResponse.data || []);
      setCorrectivos(correctivosResponse.data || []);
      setPreventivos(preventivosResponse.data || []);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCuadrillaData = async () => {
    if (!sucursalesLocations.length) return;
    try {
      const responseUsers = await getUsersLocations();
      const updatedUsers = await Promise.all(
        responseUsers.data.map(async user => {
          const [Correctivos, Preventivos] = await Promise.all([
            getCorrectivos(user.id),
            getPreventivos(user.id)
          ]);
          const correctivoIds = Correctivos.data?.map(c => Number(c.id_sucursal)) || [];
          const preventivoIds = Preventivos.data?.map(p => Number(p.id_sucursal)) || [];
          const selectedSucursalIds = new Set([...correctivoIds, ...preventivoIds]);
          let filteredSucursales = sucursalesLocations.filter(s => selectedSucursalIds.has(Number(s.id)))
          filteredSucursales = [...filteredSucursales].sort((a, b) => {
            const distA = Math.sqrt(
              Math.pow(user.lat - a.lat, 2) +
              Math.pow(user.lng - a.lng, 2)
            );
            const distB = Math.sqrt(
              Math.pow(user.lat - b.lat, 2) +
              Math.pow(user.lng - b.lng, 2)
            );
            return distA - distB;
          });
          const selectedSucursales = filteredSucursales
            .map(s => ({
              id: s.id,
              name: s.name || 'Unknown',
              lat: parseFloat(s.lat),
              lng: parseFloat(s.lng)
            }));
          const correctivoMantenimientoIds = Correctivos.data?.map(c => Number(c.id_mantenimiento)) || [];
          const preventivoMantenimientoIds = Preventivos.data?.map(p => Number(p.id_mantenimiento)) || [];
          const userCorrectivos = correctivos
            .filter(c => correctivoMantenimientoIds.includes(Number(c.id)))
            .map(c => ({
              id: c.id,
              nombre_sucursal: filteredSucursales.find(s => Number(s.id) === Number(c.id_sucursal))?.name || 'Unknown',
              fecha_apertura: c.fecha_apertura || 'Sin fecha',
              numero_caso: c.numero_caso || 'Sin número',
              estado: c.estado || 'Sin estado'
            }));
          const userPreventivos = preventivos
            .filter(p => preventivoMantenimientoIds.includes(Number(p.id)))
            .map(p => ({
              id: p.id,
              nombre_sucursal: filteredSucursales.find(s => Number(s.id) === Number(p.id_sucursal))?.name || 'Unknown',
              fecha_apertura: p.fecha_apertura || 'Sin fecha',
              frecuencia: p.frecuencia || 'Sin frecuencia'
            }));
          return {
            id: user.id,
            name: user.name || 'Unknown',
            lat: parseFloat(user.lat),
            lng: parseFloat(user.lng),
            correctivos: userCorrectivos,
            preventivos: userPreventivos,
            sucursales: selectedSucursales
          };
        })
      );
      setUsers(updatedUsers.filter(user => !isNaN(user.lat) && !isNaN(user.lng) && user.lat !== 0 && user.lng !== 0));
    } catch (error) {
      console.error('Error fetching cuadrilla data:', error);
      setError('Error al cargar datos de cuadrillas');
    }
  };

  const fetchSucursalData = async () => {
    if (!sucursalesLocations.length || !cuadrillas.length || (!correctivos.length && !preventivos.length)) return;
    try {
      const updatedSucursales = await Promise.all(
        sucursalesLocations.map(async sucursal => {
          const Correctivos = correctivos
            .filter(c => Number(c.id_sucursal) === Number(sucursal.id))
            .map(c => ({
              id: c.id,
              cuadrilla_name: cuadrillas.find(cuadrilla => Number(cuadrilla.id) === Number(c.id_cuadrilla))?.name || 'Unknown',
              fecha_apertura: c.fecha_apertura || 'Sin fecha',
              numero_caso: c.numero_caso || 'Sin número',
              estado: c.estado || 'Sin estado'
            }));
          const Preventivos = preventivos
            .filter(p => Number(p.id_sucursal) === Number(sucursal.id))
            .map(p => ({
              id: p.id,
              cuadrilla_name: cuadrillas.find(cuadrilla => Number(cuadrilla.id) === Number(p.id_cuadrilla))?.name || 'Unknown',
              fecha_apertura: p.fecha_apertura || 'Sin fecha',
              frecuencia: p.frecuencia || 'Sin frecuencia'
            }));
          return {
            id: sucursal.id,
            name: sucursal.name || 'Unknown',
            lat: parseFloat(sucursal.lat),
            lng: parseFloat(sucursal.lng),
            Correctivos,
            Preventivos
          };
        })
      );
      setSucursales(updatedSucursales.filter(sucursal => !isNaN(sucursal.lat) && !isNaN(sucursal.lng) && sucursal.lat !== 0 && sucursal.lng !== 0));
    } catch (error) {
      console.error('Error fetching sucursal data:', error);
      setError('Error al cargar datos de sucursales');
    }
  };

  const generarRutas = (user) => {
    if (!user.sucursales || !mapInstanceRef.current) return;
    const waypoints = user.sucursales.map(s => L.latLng(s.lat, s.lng)).filter(Boolean);

    if (waypoints.length > 0) {
      if (routeLayersRef.current[user.id]?.control) {
        mapInstanceRef.current.removeControl(routeLayersRef.current[user.id].control);
      }

      const control = L.Routing.control({
        waypoints: [[user.lat, user.lng], ...waypoints],
        router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
        lineOptions: { styles: [{ color: '#3399FF', weight: 5 }] },
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: false,
        show: false,
        fitSelectedRoutes: false
      }).addTo(mapInstanceRef.current);

      control.on('routesfound', (e) => {
        const route = e.routes[0];
        if (routeLayersRef.current[user.id]?.polyline) {
          routeLayersRef.current[user.id].polyline.remove();
        }

        const polyline = L.polyline(route.coordinates, { color: '#3399FF', weight: 5 }).addTo(mapInstanceRef.current);

        routeLayersRef.current[user.id] = {
          control,
          polyline
        };
      });

      control.on('routingerror', (err) => {
        console.error('Routing error for user', user.id, err);
      });
    }
  };

  const showPopup = (data, latlng) => {
    if (!mapInstanceRef.current) return;

    const content =
      data.type === 'cuadrilla'
        ? `
          <div style="max-height: 200px; overflow-y: auto;">
            <h3>${data.name}</h3>
            <h4>Ruta</h4>
            <ul>
              ${data.sucursales?.map(s => `<li>${s.name}</li>`).join('') || '<li>Sin sucursales seleccionadas</li>'}
            </ul>
            <h4>Mantenimientos</h4>
            <h5>Correctivos Seleccionados</h5>
            <ul>
              ${(data.correctivos && Array.isArray(data.correctivos) ? data.correctivos : []).map(c => `
                <li>
                  Mantenimiento: ${c.id}<br/>
                  Sucursal: ${c.nombre_sucursal}<br/>
                  Fecha Apertura: ${c.fecha_apertura}<br/>
                  Número de Caso: ${c.numero_caso}<br/>
                  Estado: ${c.estado}
                </li>
              `).join('') || '<li>Sin correctivos seleccionados</li>'}
            </ul>
            <h5>Preventivos Seleccionados</h5>
            <ul>
              ${(data.preventivos && Array.isArray(data.preventivos) ? data.preventivos : []).map(p => `
                <li>
                  Mantenimiento: ${p.id}<br/>
                  Sucursal: ${p.nombre_sucursal}<br/>
                  Fecha Apertura: ${p.fecha_apertura}<br/>
                  Frecuencia: ${p.frecuencia}
                </li>
              `).join('') || '<li>Sin preventivos seleccionados</li>'}
            </ul>
          </div>
        `
        : `
          <div style="max-height: 200px; overflow-y: auto;">
            <h3>${data.name || 'Unknown'}</h3>
            <h4>Mantenimientos</h4>
            <h5>Correctivos</h5>
            <ul>
              ${(data.Correctivos && Array.isArray(data.Correctivos) ? data.Correctivos : []).map(c => `
                <li>
                  Mantenimiento: ${c.id}<br/>
                  Cuadrilla: ${c.cuadrilla_name}<br/>
                  Fecha Apertura: ${c.fecha_apertura}<br/>
                  Número de Caso: ${c.numero_caso}<br/>
                  Estado: ${c.estado}
                </li>
              `).join('') || '<li>Sin correctivos</li>'}
            </ul>
            <h5>Preventivos</h5>
            <ul>
              ${(data.Preventivos && Array.isArray(data.Preventivos) ? data.Preventivos : []).map(p => `
                <li>
                  Mantenimiento: ${p.id}<br/>
                  Cuadrilla: ${p.cuadrilla_name}<br/>
                  Fecha Apertura: ${p.fecha_apertura}<br/>
                  Frecuencia: ${p.frecuencia}
                </li>
              `).join('') || '<li>Sin preventivos</li>'}
            </ul>
          </div>
        `;

    L.popup()
      .setLatLng(latlng)
      .setContent(content)
      .openOn(mapInstanceRef.current);
  };

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else if (currentEntity.type !== 'usuario') {
      navigate('/');
    } else {
      fetchData();
    }
  }, [currentEntity, navigate]);

  useEffect(() => {
    if (isDataLoaded) {
      fetchCuadrillaData();
      fetchSucursalData();
      const cuadrillaIntervalId = setInterval(fetchCuadrillaData, 5000); // 5 seconds
      const sucursalIntervalId = setInterval(fetchSucursalData, 350000); // 5 min
      return () => {
        clearInterval(cuadrillaIntervalId);
        clearInterval(sucursalIntervalId);
      };
    }
  }, [isDataLoaded]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.invalidateSize();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !users.length || !sucursales.length) return;;
    // Add user markers
    usersMarkersRef.current.forEach(marker => marker?.remove());
    users.map(user => {
      const marker = L.marker([user.lat, user.lng], {
        icon: L.divIcon({
          html: `<div style="width: 15px; height: 20px; background:rgb(22, 109, 196); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        title: user.name
      }).addTo(mapInstanceRef.current);

      marker.on('click', () =>
        showPopup(
          {
            type: 'cuadrilla',
            name: user.name,
            correctivos: user.correctivos,
            preventivos: user.preventivos,
            sucursales: user.sucursales
          },
          [user.lat, user.lng]
        )
      );

      usersMarkersRef.current.push(marker);
      generarRutas(user);
    });

    // Add sucursal markers
    sucursalMarkersRef.current.forEach(marker => marker?.remove());
    sucursales.map(sucursal => {
      const marker = L.marker([sucursal.lat, sucursal.lng], {
        icon: L.divIcon({
          html: renderToString(<FaMapMarkerAlt style={{ color: 'rgb(22, 109, 196)', fontSize: '24px' }} />),
          className: 'sucursal-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        title: sucursal.name
      }).addTo(mapInstanceRef.current);

      marker.on('click', () =>
        showPopup(
          {
            type: 'sucursal',
            name: sucursal.name,
            Correctivos: sucursal.Correctivos,
            Preventivos: sucursal.Preventivos
          },
          [sucursal.lat, sucursal.lng]
        )
      );

      sucursalMarkersRef.current.push(marker);
    });

    return () => {
      usersMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
    };
  }, [users, sucursales]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2>Mapa de Usuarios y Sucursales</h2>
      <div ref={mapRef} style={mapContainerStyle}></div>
    </div>
  );
};

export default Mapa;