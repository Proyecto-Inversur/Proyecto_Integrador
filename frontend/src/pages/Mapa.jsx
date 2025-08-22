import React, { useEffect, useState, useRef } from 'react';
import { getUsersLocations, getSucursalesLocations, getCorrectivos, getPreventivos } from '../services/maps';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FiCompass } from 'react-icons/fi';
import { FaUserAlt, FaTruck } from "react-icons/fa";
import { renderToStaticMarkup } from "react-dom/server";
import BackButton from '../components/BackButton';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import '../styles/mapa.css';
import '../styles/botones_forms.css';

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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayersRef = useRef({});
  const usersMarkersRef = useRef([]);
  const cuadrillasMarkersRef = useRef([]);
  const sucursalMarkersRef = useRef([]);
  const compassRef = useRef(null);
  const [showEncargados, setShowEncargados] = useState(true);
  const [showCuadrillas, setShowCuadrillas] = useState(true);
  const [showSucursales, setShowSucursales] = useState(true);

  const toggleEncargados = () => setShowEncargados(prev => !prev);
  const toggleCuadrillas = () => setShowCuadrillas(prev => !prev);
  const toggleSucursales = () => setShowSucursales(prev => !prev);

  const fetchData = async () => {
    try {
      const [usersResponse, sucursalesResponse, correctivosResponse, preventivosResponse] = await Promise.all([
        getUsersLocations(),
        getSucursalesLocations(),
        getMantenimientosCorrectivos(),
        getMantenimientosPreventivos()
      ]);
      const allUsers = usersResponse.data || [];
      const parsedUsers = (allUsers || []).map(user => ({
        ...user,
        lat: parseFloat(user.lat),
        lng: parseFloat(user.lng)
      }));
      const filteredUsers = parsedUsers.filter(
        user => !isNaN(user.lat) && !isNaN(user.lng) && user.lat !== 0 && user.lng !== 0
      );
      const correctivosFiltrados = (correctivosResponse.data || []).filter(
        c => c.estado === "Pendiente"
      );
      const preventivosFiltrados = (preventivosResponse.data || []).filter(
        c => c.fecha_cierre === null
      );
      setCuadrillas(filteredUsers.filter(u => u.tipo === 'cuadrilla'));
      setUsers(filteredUsers.filter(u => u.tipo === 'Encargado de Mantenimiento'));
      setSucursalesLocations(sucursalesResponse.data || []);
      setCorrectivos(correctivosFiltrados);
      setPreventivos(preventivosFiltrados);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCuadrillaData = async () => {
    if (!sucursalesLocations.length || !cuadrillas.length) return;
    try {
      const updatedCuadrillas = await Promise.all(cuadrillas.map(async cuadrilla => {
          const [Correctivos, Preventivos] = await Promise.all([
            getCorrectivos(cuadrilla.id),
            getPreventivos(cuadrilla.id)
          ]);
          const correctivoIds = Correctivos.data?.map(c => Number(c.id_sucursal)) || [];
          const preventivoIds = Preventivos.data?.map(p => Number(p.id_sucursal)) || [];
          const selectedSucursalIds = new Set([...correctivoIds, ...preventivoIds]);
          let filteredSucursales = sucursalesLocations.filter(s => selectedSucursalIds.has(Number(s.id)))
          filteredSucursales = [...filteredSucursales].sort((a, b) => {
            const distA = Math.sqrt(
              Math.pow(cuadrilla.lat - a.lat, 2) +
              Math.pow(cuadrilla.lng - a.lng, 2)
            );
            const distB = Math.sqrt(
              Math.pow(cuadrilla.lat - b.lat, 2) +
              Math.pow(cuadrilla.lng - b.lng, 2)
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
          const cuadrillaCorrectivos = correctivos
            .filter(c => correctivoMantenimientoIds.includes(Number(c.id)))
            .map(c => ({
              id: c.id,
              nombre_sucursal: filteredSucursales.find(s => Number(s.id) === Number(c.id_sucursal))?.name || 'Unknown',
              fecha_apertura: c.fecha_apertura || 'Sin fecha',
              numero_caso: c.numero_caso || 'Sin número',
              estado: c.estado || 'Sin estado'
            }));
          const cuadrillaPreventivos = preventivos
            .filter(p => preventivoMantenimientoIds.includes(Number(p.id)))
            .map(p => ({
              id: p.id,
              nombre_sucursal: filteredSucursales.find(s => Number(s.id) === Number(p.id_sucursal))?.name || 'Unknown',
              fecha_apertura: p.fecha_apertura || 'Sin fecha',
              frecuencia: p.frecuencia || 'Sin frecuencia'
            }));
          return {
            id: cuadrilla.id,
            tipo: cuadrilla.tipo,
            name: cuadrilla.name || 'Unknown',
            lat: parseFloat(cuadrilla.lat),
            lng: parseFloat(cuadrilla.lng),
            correctivos: cuadrillaCorrectivos,
            preventivos: cuadrillaPreventivos,
            sucursales: selectedSucursales
          };
        })
      );
      setCuadrillas(updatedCuadrillas);
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

  const generarRutas = (cuadrilla) => {
    if (!cuadrilla.sucursales || !mapInstanceRef.current) return;

    const waypoints = cuadrilla.sucursales
      .map(s => L.latLng(s.lat, s.lng))
      .filter(wp => wp && !isNaN(wp.lat) && !isNaN(wp.lng));

    if (waypoints.length > 0) {
      const control = L.Routing.control({
        waypoints: [[cuadrilla.lat, cuadrilla.lng], ...waypoints],
        router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
        lineOptions: { styles: [{ color: '#2c2c2c', weight: 5 }] },
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: false,
        show: false,
        fitSelectedRoutes: false,
        containerClassName: 'hidden-routing-control'
      }).addTo(mapInstanceRef.current);

      control.on('routesfound', (e) => {
        const route = e.routes[0];
        const polyline = L.polyline(route.coordinates, { color: '#2c2c2c', weight: 5 }).addTo(mapInstanceRef.current);

        if (routeLayersRef.current[cuadrilla.id]) {
          if (routeLayersRef.current[cuadrilla.id].control) {
            mapInstanceRef.current.removeControl(routeLayersRef.current[cuadrilla.id].control);
          }
          if (routeLayersRef.current[cuadrilla.id].polyline) {
            routeLayersRef.current[cuadrilla.id].polyline.remove();
          }
        }

        routeLayersRef.current[cuadrilla.id] = {
          control,
          polyline
        };
      });

      control.on('routingerror', (err) => {
        console.error('Routing error for user', cuadrilla.id, err);
      });
    }
  };

  const showPopup = (data, latlng) => {
    if (!mapInstanceRef.current) return;

    const content =
      data.type === 'cuadrilla'
        ? 
          `
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
        : 
          data.type === 'encargado'
            ? 
              `
                <div style="max-height: 200px; overflow-y: auto;">
                  <h3>${data.name}</h3>
                </div>
              `
            :
              `
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

  const clearRoutes = () => {
    Object.values(routeLayersRef.current).forEach(({ control, polyline }) => {
      if (control) {
        mapInstanceRef.current.removeControl(control);
      }
      if (polyline) {
        polyline.remove();
      }
    });
    routeLayersRef.current = {};
  };

  const handleCuadrillaSelection = (cuadrilla) => {
    clearRoutes();
    generarRutas(cuadrilla);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cuadrilla.lat, cuadrilla.lng], 13);
    }
    showPopup(
      {
        type: 'cuadrilla',
        name: cuadrilla.name,
        correctivos: cuadrilla.correctivos,
        preventivos: cuadrilla.preventivos,
        sucursales: cuadrilla.sucursales,
      },
      [cuadrilla.lat, cuadrilla.lng]
    );
  };

  const rotarNorte = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setBearing(0, { animate: true });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      zoom: 12,
      rotate: true,
      rotateControl: false,
      zoomControl: false,
      touchRotate: true,
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
    if (!mapInstanceRef.current || !sucursales.length) return;
    usersMarkersRef.current.forEach(marker => marker?.remove());
    if (users.length && showEncargados) {
      users.map(user => {
        const marker = L.marker([user.lat, user.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaUserAlt size={22} color="#2c2c2c" />),
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: user.name
        }).addTo(mapInstanceRef.current);

        marker.on('click', () => {
          clearRoutes();
          showPopup(
            {
              type: 'encargado',
              name: user.name,
            },
            [user.lat, user.lng]
          )
        });

        usersMarkersRef.current.push(marker);
      });
    }

    cuadrillasMarkersRef.current.forEach(marker => marker?.remove());
    if (cuadrillas.length && showCuadrillas) {
      cuadrillas.map(cuadrilla => {
        const marker = L.marker([cuadrilla.lat, cuadrilla.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaTruck size={22} color="#2c2c2c" />),
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: cuadrilla.name
        }).addTo(mapInstanceRef.current);

        marker.on('click', () => handleCuadrillaSelection(cuadrilla));

        cuadrillasMarkersRef.current.push(marker);
      });
    }

    sucursalMarkersRef.current.forEach(marker => marker?.remove());
    if (sucursales.length && showSucursales) {
      sucursales.map(sucursal => {
        const marker = L.marker([sucursal.lat, sucursal.lng], {
          icon: L.divIcon({
            html: renderToString(<FaMapMarkerAlt size={22} color="#2c2c2c" />),
            className: 'sucursal-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: sucursal.name
        }).addTo(mapInstanceRef.current);

        marker.on('click', () => {
          clearRoutes();
          showPopup(
            {
              type: 'sucursal',
              name: sucursal.name,
              Correctivos: sucursal.Correctivos,
              Preventivos: sucursal.Preventivos
            },
            [sucursal.lat, sucursal.lng]
          )
        });

        sucursalMarkersRef.current.push(marker);
      });
    }

    return () => {
      usersMarkersRef.current.forEach(marker => marker?.remove());
      cuadrillasMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
    };
  }, [cuadrillas, users, sucursales, showEncargados, showCuadrillas, showSucursales]);

  useEffect(() => {
    if (!mapInstanceRef.current || !compassRef.current) return;

    const map = mapInstanceRef.current;

    const updateCompass = () => {
      const angle = map.getBearing ? map.getBearing() : 0; // leaflet-rotate
      // Aguja compensa la rotación del mapa
      const needle = compassRef.current.querySelector('.compass-needle');
      if (needle) needle.style.transform = `rotate(${-angle}deg)`;
    };

    map.on('rotate', updateCompass);
    updateCompass();

    return () => map.off('rotate', updateCompass);
  }, []);


  return (
  <div className="map-container">
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="contenido-wrapper">
      <BackButton />
      <div className="map-controls">
        <h2>Mapa de Usuarios y Sucursales</h2>
      </div>
      <div className="map-main">
        <div className="map-sidebar-left">
          <h4>Cuadrillas</h4>
          {cuadrillas.length === 0 && <p>No hay cuadrillas activas.</p>}
          {cuadrillas.map(cuadrilla => (
            <div
              key={cuadrilla.id}
              className="obra-item"
              onClick={() => handleCuadrillaSelection(cuadrilla)}
            >
              <strong>- {cuadrilla.name}</strong>
              <br />
              <small>{cuadrilla.sucursales?.length || 0} obras asignadas</small>
            </div>
          ))}
          <h4>Encargados</h4>
          {users.length === 0 && <p>No hay encargados.</p>}
          {users.map(user => (
            <div
              key={user.id}
              className="obra-item"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([user.lat, user.lng], 13);
                  clearRoutes();
                  showPopup(
                    {
                      type: 'encargado',
                      name: user.name,
                    },
                    [user.lat, user.lng]
                  );
                }
              }}
            >
              <strong>- {user.name}</strong>
              <br />
            </div>
          ))}
        </div>

        <div className="map-sidebar-rigth">
          <h4>Sucursales</h4>
          {sucursales.length === 0 && <p>No hay sucursales activas.</p>}
          {sucursales.map(sucursal => (
            <div
              key={sucursal.id}
              className="obra-item"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([sucursal.lat, sucursal.lng], 13);
                  clearRoutes();
                  showPopup(
                    {
                      type: 'sucursal',
                      name: sucursal.name,
                      Correctivos: sucursal.Correctivos,
                      Preventivos: sucursal.Preventivos
                    },
                    [sucursal.lat, sucursal.lng]
                  );
                }
              }}
            >
              <strong>- {sucursal.name}</strong>
              <br />
              <small>{sucursal.Correctivos?.length || 0} correctivos, {sucursal.Preventivos?.length || 0} preventivos</small>
            </div>
          ))}
        </div>

        <div className="container-map">
          <div ref={mapRef} className="ruta-map"></div>
          <button onClick={toggleCuadrillas} className={`cuadrillas ${showCuadrillas ? "active" : ""}`}>
            <FaTruck size={20} color="currentColor" />
          </button>
          <button onClick={toggleEncargados} className={`encargados ${showEncargados ? "active" : ""}`}>
            <FaUserAlt size={20} color="currentColor" />
          </button>
          <button onClick={toggleSucursales} className={`sucursales ${showSucursales ? "active" : ""}`}>
            <FaMapMarkerAlt size={20} color="currentColor" />
          </button>
          <div
            ref={compassRef}
            className="compass"
            onClick={rotarNorte}
            aria-label="Orientar al norte"
            title="Orientar al norte"
          >
            <FiCompass className="compass-needle" size={22} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default Mapa;