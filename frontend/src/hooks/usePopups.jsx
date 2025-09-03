import L from "leaflet";
import { renderToString } from "react-dom/server";
import CuadrillaPopup from "../components/CuadrillaPopup";
import EncargadoPopup from "../components/EncargadoPopup";
import SucursalPopup from "../components/SucursalPopup";

export function usePopups(mapInstanceRef, isMobile) {
  const showPopup = (data, latlng) => {
    if (!mapInstanceRef.current) return;
    let html;

    if (data.type === "cuadrilla") {
      html = renderToString(<CuadrillaPopup cuadrilla={data} />);
    } else if (data.type === "encargado") {
      html = renderToString(<EncargadoPopup encargado={data} />);
    } else {
      html = renderToString(<SucursalPopup sucursal={data} />);
    }

    const popup = L.popup({
      className: "inversur-popup",
      maxWidth: isMobile ? 280 : 420,
      closeButton: true,
      autoPan: false,
      offset: L.point(0, -10),
    })
      .setLatLng(latlng)
      .setContent(html)
      .openOn(mapInstanceRef.current);

    const el = popup.getElement ? popup.getElement() : popup._container;
    if (el) {
      L.DomEvent.disableScrollPropagation(el);
      L.DomEvent.disableClickPropagation(el);
    }

    if (isMobile) {
      const map = mapInstanceRef.current;
      const p = map.latLngToContainerPoint(latlng);
      const target = L.point(map.getSize().x / 2, map.getSize().y / 2 + 60);
      const delta = target.subtract(p);
      const newCenterPoint = map
        .latLngToContainerPoint(map.getCenter())
        .subtract(delta);
      const newCenter = map.containerPointToLatLng(newCenterPoint);
      map.panTo(newCenter, { animate: true });
    }
  };

  return { showPopup };
}
