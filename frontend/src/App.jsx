import React, { useState } from "react";
import StoreMapComponent from "./components/StoreMapComponent";
import FlavorDrawer from "./components/FlavorDrawer";
import HamburgerButton from "./components/HamburgerButton";
import { useFlavors } from "./hooks/useFlavors";
import { fontStack, colors } from "./components/styleTokens";
import "./utils/leafletSetup";

export default function App() {
  const { flavors, loading } = useFlavors();
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: fontStack,
        background: `linear-gradient(180deg, ${colors.bgApp} 0%, #eef2f6 100%)`
      }}
    >

      <FlavorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        flavors={flavors}
        selectedFlavor={selectedFlavor}
        setSelectedFlavor={setSelectedFlavor}
      />

      <main style={{ flex: 1, minHeight: 0 }}>
        <StoreMapComponent
          selectedFlavor={selectedFlavor}
          flavors={flavors}
          onStoreSelect={() => {}}
        />
      </main>

      {loading && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "6px 14px",
            borderRadius: 40,
            boxShadow: "0 4px 16px rgba(15,23,42,0.15)",
            fontSize: 13,
            fontWeight: 500,
            color: colors.textSoft,
            display: "flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: ".5px",
            zIndex: 1300
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: colors.accent,
            animation: "pulse 1s infinite alternate"
          }} />
          Chargement des saveurs...
        </div>
      )}
    </div>
  );
}
