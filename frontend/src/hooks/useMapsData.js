import { useState, useEffect } from "react";
import {
  getUsersLocations,
  getSucursalesLocations,
} from "../services/maps";
import { getMantenimientosCorrectivos } from "../services/mantenimientoCorrectivoService";
import { getMantenimientosPreventivos } from "../services/mantenimientoPreventivoService";

export function useMapsData() {
  const [users, setUsers] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalesLocations, setSucursalesLocations] = useState([]);
  const [correctivos, setCorrectivos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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

      setCuadrillas(filteredUsers.filter((u) => u.tipo === "cuadrilla"));
      setUsers(
        filteredUsers.filter((u) => u.tipo === "Encargado de Mantenimiento")
      );
      setSucursalesLocations(sucursalesRes.data || []);
      setCorrectivos((correctivosRes.data || []).filter((c) => !c.fecha_cierre));
      setPreventivos((preventivosRes.data || []).filter((p) => !p.fecha_cierre));
      setIsDataLoaded(true);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    cuadrillas,
    sucursales,
    sucursalesLocations,
    correctivos,
    preventivos,
    isDataLoaded,
    setUsers,
    setCuadrillas,
    setSucursales,
    setSucursalesLocations,
    setCorrectivos,
    setPreventivos,
    fetchData,
  };
}