import React, { useRef, useState, useEffect, useCallback } from "react";
import { fetchStoreById } from "../utils/api";
import { MapUpdater } from "./MapHelpers";
import MapSection from "./MapSection";
import DetailsSection from "./DetailsSection";
import FlavorDrawer, { FlavorDrawerButton } from "./FlavorDrawer";
import AboutPanel from "./AboutPanel";
import { fontStack, colors } from "./styleTokens";

export default function StoreMapComponent({ flavors = [], onStoreSelect = () => {} }) {
  const mapRef = useRef(null);

  const [clusters, setClusters] = useState([]);
  const [visibleStores, setVisibleStores] = useState([]);

  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const primarySelectedFlavor = selectedFlavors[0] || null;
  const [flavorDrawerOpen, setFlavorDrawerOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(() => !sessionStorage.getItem("sessionId"));

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
    map.flyTo([cluster.lat, cluster.lon], targetZoom, {
      duration: 0.6
    });
  }, []);

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

      <div className="map-top-toolbar">
        <FlavorDrawerButton
          open={flavorDrawerOpen}
          onClick={()=>setFlavorDrawerOpen(o=>!o)}
          multi
          count={selectedFlavors.length}
        />
        <button
          type="button"
          className={`about-toggle-btn ${showAbout ? "is-active" : ""}`}
          aria-pressed={showAbout}
          aria-label={showAbout ? "Fermer À propos" : "Ouvrir À propos"}
          title="À propos"
          onClick={() => setShowAbout(o => !o)}
        >
          <span className="about-toggle-btn__bg" aria-hidden="true" />
          <span className="about-toggle-btn__icon" aria-hidden="true">
            <svg
              className="about-toggle-btn__svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 10v7" />
              <path d="M12 7.25v.01" />
            </svg>
          </span>
          <span className="about-toggle-btn__label">À propos</span>
        </button>
      </div>

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

      <AboutPanel
        open={showAbout}
  onClose={() => setShowAbout(false)}
      />
    </div>
  );
}
