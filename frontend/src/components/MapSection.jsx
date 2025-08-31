import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapUpdater, MapController, MapZoom } from "./MapHelpers";
import StoreMarkers from "./StoreMarkers";
import { panelStyle } from "./styleTokens";

export default function MapSection({
  selectedFlavor,
  clusteredStores,
  setClusteredStores,
  mapRef,
  onClusterClick,
  onStoreSelect,
  expanded // true = plein écran
}) {
  return (
    <div
      style={{
        // animation fluide entre plein écran et mode partagé
        flex: expanded ? "1 1 auto" : "0 0 33%", // CHANGÉ: avant 55%
        minHeight: 0,
        transition: "flex-basis 320ms ease",
        ...panelStyle
      }}
    >
      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MapUpdater selectedFlavor={selectedFlavor} onStoresFetched={setClusteredStores} />
        <MapController mapRef={mapRef} />
        <MapZoom />
        <StoreMarkers
          clusteredStores={clusteredStores}
          onClusterClick={onClusterClick}
          onSingleStore={onStoreSelect}
        />
      </MapContainer>
    </div>
  );
}