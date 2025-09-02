import React, { useRef, useState, useEffect, useCallback } from "react";
import { fetchStoreById } from "../utils/api";
import { MapUpdater } from "./MapHelpers";
import ControlsPanel from "./ControlsPanel";
import MapSection from "./MapSection";
import DetailsSection from "./DetailsSection";
import FlavorDrawer from "./FlavorDrawer";
import { fontStack, colors } from "./styleTokens";

export default function StoreMapComponent({ flavors = [], onStoreSelect = () => {} }) {
  const mapRef = useRef(null);

  // Séparer clusters et points
  const [clusters, setClusters] = useState([]);
  const [visibleStores, setVisibleStores] = useState([]);

  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const primarySelectedFlavor = selectedFlavors[0] || null;
  const [flavorDrawerOpen, setFlavorDrawerOpen] = useState(false);

  const toggleFlavor = useCallback((flavorId) => {
    setSelectedFlavors(prev =>
      prev.includes(flavorId)
        ? prev.filter(id => id !== flavorId)
        : [...prev, flavorId]
    );
  }, []);
  const resetFlavors = useCallback(() => setSelectedFlavors([]), []);

  const onClusterClick = useCallback((cluster) => {
    if (!cluster || !mapRef.current) return;
    const map = mapRef.current;
    const currentZoom = map.getZoom();
    const targetZoom = Math.min(
      (typeof currentZoom === "number" ? currentZoom : 0) + 2,
      map.getMaxZoom ? map.getMaxZoom() : 19
    );
    // Recentrer + zoom (flyTo pour animation douce)
    map.flyTo([cluster.lat, cluster.lon], targetZoom, {
      duration: 0.6
    });
  }, []);

  // Détails store
  useEffect(() => {
    let abort = false;
    if (!selectedStoreId) { setSelectedStore(null); return; }
    (async () => {
      try {
        const d = await fetchStoreById(selectedStoreId);
        if (!abort) setSelectedStore(d);
      } catch {
        if (!abort) setSelectedStore(null);
      }
    })();
    return () => { abort = true; };
  }, [selectedStoreId]);

  const clearSelection = useCallback(() => {
    setSelectedStoreId(null);
    setSelectedStore(null);
    setDetailsExpanded(false);
    setTimeout(() => mapRef.current?.invalidateSize(), 350);
    onStoreSelect(null);
  }, [onStoreSelect]);

  const toggleAvailability = useCallback((flavorName) => {
    if (!selectedStore) return;
    setSelectedStore(prev => {
      if (!prev) return prev;
      const copy = { ...prev, storeFlavors: [...(prev.storeFlavors||[])] };
      const idx = copy.storeFlavors.findIndex(f => (f.flavorName || f.flavor?.name) === flavorName);
      if (idx >= 0) {
        const cur = copy.storeFlavors[idx].available;
        copy.storeFlavors[idx] = { ...copy.storeFlavors[idx], available: (cur + 1) % 3 };
      }
      return copy;
    });
  }, [selectedStore]);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      fontFamily: fontStack,
      background: `linear-gradient(180deg, ${colors.bgApp} 0%, #edf1f5 100%)`,
      boxSizing: "border-box",
      position: "relative"
    }}>
      <button
        type="button"
        onClick={() => setFlavorDrawerOpen(true)}
        style={{
          position: "absolute",
            top: 12,
          left: 12,
          zIndex: 1400,
          padding: "10px 16px",
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          background: "#fff",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Saveurs {selectedFlavors.length ? `(${selectedFlavors.length})` : ""}
      </button>

      {/* MapSection doit rendre un <MapContainer> et accepter children (sinon injecte MapUpdater dedans) */}
      <MapSection
        mapRef={mapRef}
        clusters={clusters}
        stores={visibleStores}
        onClusterClick={onClusterClick}
        onStoreSelect={(id) => { setSelectedStoreId(id); onStoreSelect(id); }}
      >
        <MapUpdater
          selectedFlavor={primarySelectedFlavor}
          selectedFlavors={selectedFlavors}
          onClustersFetched={setClusters}
          onStoresFetched={setVisibleStores}
        />
      </MapSection>

      <DetailsSection
        selectedStore={selectedStore}
        clearSelection={clearSelection}
        toggleAvailability={toggleAvailability}
        visible={!!selectedStore}
        expanded={detailsExpanded}
        setExpanded={setDetailsExpanded}
        onClose={clearSelection}
      />

      <FlavorDrawer
        open={flavorDrawerOpen}
        onClose={() => setFlavorDrawerOpen(false)}
        flavors={flavors}
        selectedFlavors={selectedFlavors}
        setSelectedFlavors={setSelectedFlavors}
      />

      {/* <ControlsPanel
        selectedFlavor={primarySelectedFlavor}
        selectedFlavors={selectedFlavors}
        onToggleFlavor={toggleFlavor}
        onResetFlavors={resetFlavors}
        flavors={flavors}
      /> */}
    </div>
  );
}
