import { useState, useEffect } from "react";
import { getUsersLocations, getSucursalesLocations, getCorrectivos, getPreventivos } from "../../services/maps";
import { getMantenimientosCorrectivos } from "../../services/mantenimientoCorrectivoService";
import { getMantenimientosPreventivos } from "../../services/mantenimientoPreventivoService";

export function useMapsData() {
  const [users, setUsers] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalesLocations, setSucursalesLocations] = useState([]);
  const [correctivos, setCorrectivos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const composeSucursales = (locations, cuadrillasList, correctivosList, preventivosList) =>
    (locations || [])
      .map((sucursal) => {
        const lat = parseFloat(sucursal.lat);
        const lng = parseFloat(sucursal.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          return null;
        }

        const correctivosDetalle = (correctivosList || [])
          .filter((c) => Number(c.id_sucursal) === Number(sucursal.id))
          .map((c) => ({
            id: c.id,
            cuadrilla_name:
              cuadrillasList.find((cuadrilla) => Number(cuadrilla.id) === Number(c.id_cuadrilla))?.name ||
              'Unknown',
            fecha_apertura: c.fecha_apertura || 'Sin fecha',
            numero_caso: c.numero_caso || 'Sin número',
            estado: c.estado || 'Sin estado',
          }));

        const preventivosDetalle = (preventivosList || [])
          .filter((p) => Number(p.id_sucursal) === Number(sucursal.id))
          .map((p) => ({
            id: p.id,
            cuadrilla_name:
              cuadrillasList.find((cuadrilla) => Number(cuadrilla.id) === Number(p.id_cuadrilla))?.name ||
              'Unknown',
            fecha_apertura: p.fecha_apertura || 'Sin fecha',
            frecuencia: p.frecuencia || 'Sin frecuencia',
          }));

        return {
          id: sucursal.id,
          name: sucursal.name || sucursal.nombre || 'Unknown',
          lat,
          lng,
          Correctivos: correctivosDetalle,
          Preventivos: preventivosDetalle,
        };
      })
      .filter(Boolean);

  const fetchData = async () => {
    try {
      const [usersRes, sucursalesRes, correctivosRes, preventivosRes] =
        await Promise.all([
          getUsersLocations(),
          getSucursalesLocations(),
          getMantenimientosCorrectivos(),
          getMantenimientosPreventivos(),
        ]);

      const parsedUsers = (usersRes.data || []).map((u) => ({
        ...u,
        lat: parseFloat(u.lat),
        lng: parseFloat(u.lng),
      }));

      const filteredUsers = parsedUsers.filter(
        (u) => !isNaN(u.lat) && !isNaN(u.lng) && u.lat !== 0 && u.lng !== 0
      );

      const cuadrillasList = filteredUsers.filter((u) => u.tipo === "cuadrilla");
      const encargados = filteredUsers.filter((u) => u.tipo === "Encargado de Mantenimiento");
      const rawSucursales = sucursalesRes.data || [];
      const activeCorrectivos = (correctivosRes.data || []).filter((c) => !c.fecha_cierre);
      const activePreventivos = (preventivosRes.data || []).filter((p) => !p.fecha_cierre);

      setCuadrillas(cuadrillasList);
      setUsers(encargados);
      setSucursalesLocations(rawSucursales);
      setCorrectivos(activeCorrectivos);
      setPreventivos(activePreventivos);
      setSucursales(composeSucursales(rawSucursales, cuadrillasList, activeCorrectivos, activePreventivos));
      setIsDataLoaded(true);
    } catch (e) {
      console.error("Error fetching data:", e);
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
    }
  };
  
  const fetchSucursalData = async () => {
    if (!sucursalesLocations.length) return;
    try {
      setSucursales(composeSucursales(sucursalesLocations, cuadrillas, correctivos, preventivos));
    } catch (error) {
      console.error('Error fetching sucursal data:', error);
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

  return {
    users,
    cuadrillas,
    sucursales
  };
}
