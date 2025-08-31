import React, { useRef, useState, useEffect } from "react";
import L from "leaflet";
import { fetchClusteredStores, fetchStoreById } from "../utils/api";
import ControlsPanel from "./ControlsPanel";
import MapSection from "./MapSection";
import DetailsSection from "./DetailsSection";
import { fontStack, colors } from "./styleTokens";

export default function StoreMapComponent({ selectedFlavor, flavors = [], onStoreSelect = () => {} }) {
  const mapRef = useRef(null);
  const [clusteredStores, setClusteredStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  // charge détails magasin
  useEffect(() => {
    let mounted = true;
    if (!selectedStoreId) {
      setSelectedStore(null);
      return;
    }
    (async () => {
      try {
        const store = await fetchStoreById(selectedStoreId);
        if (mounted) setSelectedStore(store);
      } catch (e) {
        console.error("fetchStoreById failed", e);
        if (mounted) setSelectedStore(null);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoreId]);

  const onClusterClick = (point) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView(L.latLng(point.lat, point.lon), Math.min(map.getZoom() + 2, map.getMaxZoom?.() || 22), { animate: true });
    clearSelection();
  };

  const toggleAvailability = (flavorName) => {
    setSelectedStore(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        storeFlavors: (prev.storeFlavors || []).map(sf =>
          sf.flavorName === flavorName
            ? { ...sf, available: sf.available === 1 ? 2 : sf.available === 2 ? 0 : 1 }
            : sf
        )
      };
    });
  };

  const sortedFlavorsForRender = (list = []) => {
    const rank = v => (v === 1 ? 0 : v === 0 ? 1 : 2);
    return [...list].sort(
      (a, b) =>
        rank(a.available) - rank(b.available) ||
        (a.flavor?.name || a.flavorName).localeCompare(b.flavor?.name || b.flavorName)
    );
  };

  const clearSelection = () => {
    setSelectedStoreId(null);
    setSelectedStore(null);
    onStoreSelect(null);
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      fontFamily: fontStack,
      background: `linear-gradient(180deg, ${colors.bgApp} 0%, #edf1f5 100%)`,
      boxSizing: "border-box"
    }}>
      <div style={{ flex: "0 0 auto" }}>
        <ControlsPanel selectedFlavor={selectedFlavor} flavors={flavors} />
      </div>

      <MapSection
        selectedFlavor={selectedFlavor}
        clusteredStores={clusteredStores}
        setClusteredStores={setClusteredStores}
        mapRef={mapRef}
        onClusterClick={onClusterClick}
        onStoreSelect={(id) => {
          setSelectedStoreId(id);
          onStoreSelect(id);
        }}
        expanded={!selectedStore} // NEW: plein écran tant qu'aucune sélection
      />

      <DetailsSection
        selectedStore={selectedStore}
        clearSelection={clearSelection}
        toggleAvailability={toggleAvailability}
        sortedFlavorsForRender={sortedFlavorsForRender}
        visible={!!selectedStore} // NEW: animation apparition
      />
    </div>
  );
}
