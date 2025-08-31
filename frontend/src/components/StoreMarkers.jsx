import React from "react";
import { Marker, Popup } from "react-leaflet";
import { getMarkerIcon } from "../utils/mapIcons";

export default function StoreMarkers({ clusteredStores, onClusterClick, onSingleStore }) {
  return (
    <>
      {clusteredStores.map(point => {
        const isCluster = point.store_count > 1;
        const id = !isCluster && Array.isArray(point.store_ids) ? point.store_ids[0] : null;
        return (
          <Marker
            key={`${point.lat}-${point.lon}`}
            position={[point.lat, point.lon]}
            icon={getMarkerIcon(point.store_count)}
            eventHandlers={{
              click: () => {
                if (isCluster) onClusterClick(point);
                else if (id) onSingleStore(Number(id));
              }
            }}
          >
            <Popup>
              {isCluster ? `${point.store_count} magasins` : (point.store_names?.[0] ?? "Magasin")}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}