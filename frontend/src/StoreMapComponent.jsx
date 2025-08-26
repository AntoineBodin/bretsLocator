import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet"; // <--- ajouté
import "leaflet/dist/leaflet.css";
import { greenIcon, grayIcon, redIcon } from "./icons";

export default function StoreMapComponent({ stores = [], selectedFlavor }) {

  function getMarkerIcon(store) {
    if (!selectedFlavor) return greenIcon; // bleu par défaut si aucune saveur sélectionnée
    const sf = store.storeFlavors?.find(sf => sf.flavor.name === selectedFlavor);
    if (!sf) return grayIcon;             // pas de saveur => gris
    if (sf.available === 1) return greenIcon;
    if (sf.available === 2) return redIcon;
    return grayIcon;
  }

  return (
    // donner une hauteur explicite ici pour éviter un parent à 0px
    <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      {stores.map(store => (
        <Marker
          key={store.id}
          position={[store.lat, store.lon]}
          icon={getMarkerIcon(store)}
        >

          <Popup>
            <b>{store.name}</b><br />
            {store.storeFlavors?.map(sf => (
              <div
                key={sf.flavor.name}
                style={{ color: sf.available === 1 ? "green" : sf.available === 2 ? "red" : "gray" }}
              >
                {sf.flavor.name} {sf.available === 1 ? "✅" : sf.available === 2 ? "❌" : "—"}
              </div>
            ))}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function getStoreIcon(store, selectedFlavor) {
  const available = selectedFlavor
    ? (store.storeFlavors || []).some((sf) => sf.flavor.name === selectedFlavor && sf.available === 1)
    : true;

  const iconColor = available ? "#3388ff" : "#ccc";
  return new L.Icon({
    iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=shop|${iconColor.slice(1)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });
}