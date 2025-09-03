import { useState, useContext, useRef } from "react";
import { useAuthRoles } from '../hooks/useAuthRoles';
import { LocationContext } from "../context/LocationContext";
import { getSucursalesLocations, getCorrectivos, getPreventivos } from "../services/maps";
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { notify_nearby_maintenances } from "../services/notificaciones";
import L from "leaflet";

const NOTIFY_DISTANCE = 10000;

export const useRutaData = (isNavigating) => {
  const { id } = useAuthRoles();
  const { userLocation } = useContext(LocationContext);
  const [sucursales, setSucursales] = useState([]);
  const notifiedMaintenancesRef = useRef(new Set());

  const fetchData = async () => {
    if (!id || !userLocation) return;
    try {
      const [sucursalesRes, correctivosRes, preventivosRes] = await Promise.all([
        getSucursalesLocations(),
        getCorrectivos(parseInt(id)),
        getPreventivos(parseInt(id)),
      ]);

      const allSucursales = sucursalesRes.data;
      const correctivoIds = correctivosRes.data || [];
      const preventivoIds = preventivosRes.data || [];

      const selectedIds = new Set([
        ...correctivoIds.map((c) => Number(c.id_sucursal)),
        ...preventivoIds.map((p) => Number(p.id_sucursal)),
      ]);

      let filtered = allSucursales.filter((s) =>
        selectedIds.has(Number(s.id))
      );

      if (userLocation) {
        filtered = [...filtered].sort((a, b) => {
          const distA =
            Math.pow(userLocation.lat - a.lat, 2) +
            Math.pow(userLocation.lng - a.lng, 2);
          const distB =
            Math.pow(userLocation.lat - b.lat, 2) +
            Math.pow(userLocation.lng - b.lng, 2);
          return distA - distB;
        });
      }

      setSucursales(filtered);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const checkNearbyMaintenances = async (currentLatLng) => {
    if (!id || !isNavigating) return;

    try {
      const [
        sucursalesRes,
        allCorrectivosRes,
        allPreventivosRes,
        selectedCorrectivosRes,
        selectedPreventivosRes,
      ] = await Promise.all([
        getSucursalesLocations(),
        getMantenimientosCorrectivos(),
        getMantenimientosPreventivos(),
        getCorrectivos(parseInt(id)),
        getPreventivos(parseInt(id)),
      ]);

      const selectedIds = new Set([
        ...selectedCorrectivosRes.data.map((c) => c.id_mantenimiento),
        ...selectedPreventivosRes.data.map((p) => p.id_mantenimiento),
      ]);

      const nearbySucursalIds = new Set(
        sucursalesRes.data
          .filter(
            (s) =>
              currentLatLng.distanceTo(L.latLng(s.lat, s.lng)) <= NOTIFY_DISTANCE
          )
          .map((s) => Number(s.id))
      );

      const allMaintenances = [
        ...allCorrectivosRes.data
          .filter((m) => m.estado === "Pendiente")
          .map((m) => ({ ...m, tipo: "correctivo" })),
        ...allPreventivosRes.data
          .filter((m) => m.estado === "Pendiente")
          .map((m) => ({ ...m, tipo: "preventivo" })),
      ];

      const nearMaintenances = allMaintenances.filter(
        (m) =>
          m.id_cuadrilla === parseInt(id) &&
          nearbySucursalIds.has(m.id_sucursal) &&
          !selectedIds.has(m.id)
      );

      const payload = [];
      nearMaintenances.forEach((m) => {
        const key = `${m.tipo}-${m.id}`;
        if (notifiedMaintenancesRef.current.has(key)) return;
        const suc = sucursalesRes.data.find(
          (s) => Number(s.id) === m.id_sucursal
        );
        payload.push({
          id: m.id,
          tipo: m.tipo,
          mensaje: `Mantenimiento ${m.tipo} pendiente cercano en la sucursal: ${
            suc ? suc.name : m.id_sucursal
          }`,
        });
        notifiedMaintenancesRef.current.add(key);
      });

      if (payload.length) {
        await notify_nearby_maintenances({ mantenimientos: payload });
      }
    } catch (err) {
      console.error("Error checking nearby maintenances:", err);
    }
  };

  return { sucursales, setSucursales, fetchData, checkNearbyMaintenances };
};
