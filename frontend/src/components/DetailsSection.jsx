import React from "react";
import StoreDetailsPanel from "./StoreDetailsPanel";
import { panelStyle } from "./styleTokens";

export default function DetailsSection({
  selectedStore,
  clearSelection,
  toggleAvailability,
  sortedFlavorsForRender,
  visible
}) {
  return (
    <div
      style={{
        position: "relative",
        flex: visible ? "0 0 67%" : "0 0 0px", // CHANGÉ: avant 45%
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: 0,
        ...panelStyle,
        transition: "flex-basis 320ms ease, opacity 260ms ease, transform 320ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        pointerEvents: visible ? "auto" : "none"
      }}
      aria-hidden={!visible}
    >
      <StoreDetailsPanel
        selectedStore={selectedStore}
        onClose={clearSelection}
        toggleAvailability={toggleAvailability}
        sortedFlavorsForRender={sortedFlavorsForRender}
      />
    </div>
  );
}