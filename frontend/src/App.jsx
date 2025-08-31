import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import StoreMapComponent from "./components/StoreMapComponent";
import { fetchFlavors, fetchStoreById } from "./utils/api";
import { API_URL } from "./utils/config";
import { fuzzyMatches } from "./utils/fuzzy";
import SearchInput from "./components/SearchInput";

export default function App() {
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [flavors, setFlavors] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // search / filter state for drawer
  const [flavorQuery, setFlavorQuery] = useState("");

  // id and full info of selected store (null = none / or cluster)
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const modernFontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', system-ui, sans-serif";

  useEffect(() => {
    async function loadFlavors() {
      try {
        const res = await fetchFlavors();
        setFlavors(res);
      } catch (err) { console.error(err); }
    }
    loadFlavors();
  }, []);

  // fetch store details when id changes
  useEffect(() => {
    let mounted = true;
    if (!selectedStoreId) {
      setSelectedStore(null);
      return;
    }
    (async () => {
      try {
        const data = await fetchStoreById(selectedStoreId);
        if (!mounted) return;
        setSelectedStore(data);
      } catch (err) {
        console.error("fetchStoreById failed:", err);
        if (mounted) setSelectedStore(null);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoreId]);

  const filteredFlavors = useMemo(() => {
    if (!flavorQuery) return flavors;
    return flavors.filter(f => fuzzyMatches(f.name || f.title || "", flavorQuery));
  }, [flavors, flavorQuery]);

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: modernFontStack }}>
      {/* Hamburger / drawer toggle */}
      <button
        aria-label="Ouvrir le menu"
        onClick={() => setDrawerOpen(prev => !prev)}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 1200,
          width: 44,
          height: 44,
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          fontFamily: "inherit",
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        ☰
      </button>

      {/* Drawer */}
      <div
        role="dialog"
        aria-hidden={!drawerOpen}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 300,
          maxWidth: "80vw",
          background: "#fff",
          boxShadow: "2px 0 18px rgba(0,0,0,0.12)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 240ms ease",
          zIndex: 1150,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: modernFontStack
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Saveurs</strong>
            <button 
              aria-label="Fermer le menu" 
              onClick={() => setDrawerOpen(false)} 
              style={{ 
                border: "none", 
                background: "transparent", 
                fontSize: 20, 
                fontFamily: "inherit",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>

          {/* search input */}
          <div style={{ marginTop: 8 }}>
            <SearchInput
              value={flavorQuery}
              onChange={(q) => setFlavorQuery(q)}
              placeholder="Rechercher une saveur"
              aria-label="Rechercher une saveur"
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <Header
            selectedFlavor={selectedFlavor}
            setSelectedFlavor={(f) => { setSelectedFlavor(f); setDrawerOpen(false); }}
            flavors={filteredFlavors}
            vertical
          />
        </div>
      </div>

      {/* Backdrop when drawer open */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 1100
          }}
        />
      )}

      {/* Main content: map + info panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* ensure StoreMapComponent receives full viewport height so it can split 50/50 internally */}
        <div style={{ height: "100%", minHeight: 0 }}>
          <StoreMapComponent
            selectedFlavor={selectedFlavor}
            flavors={flavors}
            onStoreSelect={(id) => setSelectedStoreId(id)}
          />
        </div>
      </div>
    </div>
  );
}
