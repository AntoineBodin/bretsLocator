// (si tu n'en as pas déjà un dans utils/)
import L from "leaflet";

export function getMarkerIcon(count) {
  return L.divIcon({
    html: `<div style="background:#3388ff; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:600;">${count}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}