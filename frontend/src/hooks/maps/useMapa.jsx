import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import { FaUserAlt, FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import { renderToStaticMarkup } from "react-dom/server";

import { useMapsData } from "./useMapsData";
import { useMapRoutes } from "./useMapRoutes";
import { usePopups } from "./usePopups";
import { getClientes } from "../../services/clienteService";
import { getSucursales } from "../../services/sucursalService";
import { getZonas } from "../../services/zonaService";
import { getCuadrillas as getCuadrillasService } from "../../services/cuadrillaService";

const useMapa = (mapInstanceRef, createRoutingControl, isMobile) => {
  const {
    users,
    cuadrillas: rawCuadrillas,
    sucursales
  } = useMapsData();

  const { generarRutas, clearRoutes } = useMapRoutes(
    mapInstanceRef,
    createRoutingControl
  );
  const { showPopup } = usePopups(mapInstanceRef, isMobile);

  const [clientes, setClientes] = useState([]);
  const [sucursalMeta, setSucursalMeta] = useState({});
  const [clienteFilter, setClienteFilter] = useState("");
  const [zonaSucursalFilter, setZonaSucursalFilter] = useState("");
  const [zonaCuadrillaFilter, setZonaCuadrillaFilter] = useState("");
  const [zonas, setZonas] = useState([]);
  const [cuadrillasMeta, setCuadrillasMeta] = useState({});
  const [showEncargados, setShowEncargados] = useState(true);
  const [showCuadrillas, setShowCuadrillas] = useState(true);
  const [showSucursales, setShowSucursales] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const compassRef = useRef(null);

  const usersMarkersRef = useRef([]);
  const cuadrillasMarkersRef = useRef([]);
  const sucursalMarkersRef = useRef([]);

  const toggleEncargados = () => setShowEncargados((prev) => !prev);
  const toggleCuadrillas = () => setShowCuadrillas((prev) => !prev);
  const toggleSucursales = () => setShowSucursales((prev) => !prev);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleCuadrillaSelection = (cuadrilla) => {
    clearRoutes();
    generarRutas(cuadrilla);
    mapInstanceRef.current.setView([cuadrilla.lat, cuadrilla.lng], 13);
    showPopup({ type: "cuadrilla", ...cuadrilla }, [cuadrilla.lat, cuadrilla.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleEncargadoSelection = (user) => {
    clearRoutes();
    mapInstanceRef.current.setView([user.lat, user.lng], 13);
    showPopup({ type: "encargado", ...user }, [user.lat, user.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSucursalSelection = (sucursal) => {
    clearRoutes();
    mapInstanceRef.current.setView([sucursal.lat, sucursal.lng], 13);
    showPopup({ type: "sucursal", ...sucursal }, [sucursal.lat, sucursal.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const fetchClientesData = async () => {
      try {
        const [clientesResponse, sucursalesResponse, zonasResponse, cuadrillasResponse] = await Promise.all([
          getClientes(),
          getSucursales(),
          getZonas(),
          getCuadrillasService(),
        ]);
        setClientes(clientesResponse.data || []);
        const meta = {};
        (sucursalesResponse.data || []).forEach((sucursal) => {
          meta[sucursal.id] = sucursal;
        });
        setSucursalMeta(meta);
        setZonas(zonasResponse.data || []);
        const cuadMeta = {};
        (cuadrillasResponse.data || []).forEach((c) => {
          cuadMeta[c.id] = c;
        });
        setCuadrillasMeta(cuadMeta);
      } catch (error) {
        console.error("Error fetching clientes para el mapa:", error);
      }
    };
    fetchClientesData();
  }, []);

  const normalizeZona = (z) => (z || "").toString().trim();

  const mergeCuadrillaData = (cuads) =>
    (cuads || []).map((cuadrilla) => {
      const meta = cuadrillasMeta[cuadrilla.id] || {};
      const name = cuadrilla.name || meta.nombre || cuadrilla.nombre || 'Unknown';
      const zona = normalizeZona(cuadrilla.zona ?? meta.zona);
      return {
        ...meta,
        ...cuadrilla,
        name,
        zona,
      };
    });

  const cuadrillasCompletas = mergeCuadrillaData(rawCuadrillas);

  const zonasDesdeSucursales = Object.values(sucursalMeta || {})
    .map((sucursal) => normalizeZona(sucursal?.zona))
    .filter(Boolean);

  const zonasDesdeCuadrillas = (cuadrillasCompletas || [])
    .map((c) => normalizeZona(c.zona))
    .filter(Boolean);

  const zonasFromService = (zonas || []).map((z) => normalizeZona(z.nombre));

  const zonasDisponibles = Array.from(new Set([...zonasDesdeSucursales, ...zonasDesdeCuadrillas, ...zonasFromService])).filter(Boolean);

  const filteredSucursales = sucursales
    .map((sucursal) => {
      const meta = sucursalMeta[sucursal.id];
      const clienteId =
        meta?.cliente_id ??
        meta?.id_cliente ??
        sucursal.cliente_id ??
        sucursal.id_cliente ??
        null;
      const zona = normalizeZona(meta?.zona ?? sucursal.zona ?? null);
      const clienteNombre =
        clientes.find((c) => Number(c.id) === Number(clienteId))?.nombre ||
        meta?.cliente?.nombre ||
        sucursal.cliente_nombre ||
        'Sin cliente';
      const attachCliente = (items = []) =>
        items.map((item) => {
          const itemClienteId = item.cliente_id ?? item.id_cliente ?? clienteId;
          const itemClienteNombre =
            item.cliente_nombre ||
            clientes.find((c) => Number(c.id) === Number(itemClienteId))?.nombre ||
            clienteNombre;
          return {
            ...item,
            cliente_id: itemClienteId,
            cliente_nombre: itemClienteNombre,
          };
        });

      return {
        ...sucursal,
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        zona,
        Correctivos: attachCliente(sucursal.Correctivos),
        Preventivos: attachCliente(sucursal.Preventivos),
      };
    })
    .filter((sucursal) => {
      if (!clienteFilter) return true;
      return sucursal.cliente_id && String(sucursal.cliente_id) === clienteFilter;
    })
    .filter((sucursal) => {
      if (!zonaSucursalFilter) return true;
      return normalizeZona(sucursal.zona).toLowerCase() === normalizeZona(zonaSucursalFilter).toLowerCase();
    });

  const enrichCuadrillas = (cuads) =>
    (cuads || []).map((cuadrilla) => {
      const zonasSet = new Set();
      if (cuadrilla.zona) zonasSet.add(normalizeZona(cuadrilla.zona));
      (cuadrilla.sucursales || []).forEach((sucursal) => {
        const meta = sucursalMeta[sucursal.id];
        const zona = normalizeZona(meta?.zona ?? sucursal.zona);
        if (zona) zonasSet.add(zona);
      });
      return { ...cuadrilla, zonas: Array.from(zonasSet) };
    });

  const filteredCuadrillas = enrichCuadrillas(cuadrillasCompletas).filter((cuadrilla) => {
    if (!zonaCuadrillaFilter) return true;
    return cuadrilla.zonas?.some(
      (z) => normalizeZona(z).toLowerCase() === normalizeZona(zonaCuadrillaFilter).toLowerCase()
    );
  });

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    usersMarkersRef.current.forEach((m) => m?.remove());
    cuadrillasMarkersRef.current.forEach((m) => m?.remove());
    sucursalMarkersRef.current.forEach((m) => m?.remove());

    if (users.length && showEncargados) {
      users.forEach((user) => {
        const marker = L.marker([user.lat, user.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaUserAlt size={22} color="#2c2c2c" />),
            className: "encargado-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: user.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleEncargadoSelection(user));
        usersMarkersRef.current.push(marker);
      });
    }

    if (filteredCuadrillas.length && showCuadrillas) {
      filteredCuadrillas.forEach((c) => {
        const marker = L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaTruck size={22} color="#2c2c2c" />),
            className: "cuadrilla-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: c.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleCuadrillaSelection(c));
        cuadrillasMarkersRef.current.push(marker);
      });
    }

    if (filteredSucursales.length && showSucursales) {
      filteredSucursales.forEach((s) => {
        const marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(
              <FaMapMarkerAlt size={22} color="#2c2c2c" />
            ),
            className: "sucursal-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: s.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleSucursalSelection(s));
        sucursalMarkersRef.current.push(marker);
      });
    }

    return () => {
      usersMarkersRef.current.forEach(marker => marker?.remove());
      cuadrillasMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
    };
  }, [users, filteredCuadrillas, filteredSucursales, showEncargados, showCuadrillas, showSucursales]);

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

  return {
    users,
    cuadrillas: filteredCuadrillas,
    sucursales: filteredSucursales,
    clientes,
    clienteFilter,
    setClienteFilter,
    zonasDisponibles,
    zonaSucursalFilter,
    setZonaSucursalFilter,
    zonaCuadrillaFilter,
    setZonaCuadrillaFilter,
    compassRef,
    showEncargados,
    showCuadrillas,
    showSucursales,
    isSidebarOpen,
    toggleEncargados,
    toggleCuadrillas,
    toggleSucursales,
    toggleSidebar,
    handleCuadrillaSelection,
    handleEncargadoSelection,
    handleSucursalSelection,
    setIsSidebarOpen,
  };
};

export default useMapa;
