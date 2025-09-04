import { useRef } from "react";
import L from "leaflet";

export function useMapRoutes(mapInstanceRef, createRoutingControl) {
  const routeLayersRef = useRef({});

  const generarRutas = (cuadrilla) => {
    if (!cuadrilla.sucursales || !mapInstanceRef.current) return;
    const waypoints = cuadrilla.sucursales
      .map((s) => L.latLng(s.lat, s.lng))
      .filter((wp) => wp && !isNaN(wp.lat) && !isNaN(wp.lng));

    if (waypoints.length > 0) {
      const control = createRoutingControl([
        [cuadrilla.lat, cuadrilla.lng],
        ...waypoints,
      ]);
      if (!control) return;
      control.on("routesfound", (e) => {
        const route = e.routes[0];
        const polyline = L.polyline(route.coordinates, {
          color: "#2c2c2c",
          weight: 5,
        }).addTo(mapInstanceRef.current);

        if (routeLayersRef.current[cuadrilla.id]) {
          routeLayersRef.current[cuadrilla.id].control &&
            mapInstanceRef.current.removeControl(
              routeLayersRef.current[cuadrilla.id].control
            );
          routeLayersRef.current[cuadrilla.id].polyline &&
            routeLayersRef.current[cuadrilla.id].polyline.remove();
        }
        routeLayersRef.current[cuadrilla.id] = { control, polyline };
      });
    }
  };

  const clearRoutes = () => {
    Object.values(routeLayersRef.current).forEach(({ control, polyline }) => {
      control && mapInstanceRef.current.removeControl(control);
      polyline && polyline.remove();
    });
    routeLayersRef.current = {};
  };

  return { generarRutas, clearRoutes };
}
