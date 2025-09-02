import React from "react";
import { Marker, Tooltip } from "react-leaflet";

// stores: tableau de magasins { id, lat, lon, name, ... }
export default function StoreMarkers({ stores = [], onStoreSelect }) {
  if (!Array.isArray(stores) || !stores.length) return null;

  return (
    <>
      {stores.map(s => {
        if (typeof s.lat !== "number" || typeof s.lon !== "number") return null;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lon]}
            eventHandlers={{
              click: () => onStoreSelect?.(s.id)
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {s.name || "Magasin"}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}