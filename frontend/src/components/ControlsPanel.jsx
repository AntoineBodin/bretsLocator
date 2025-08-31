import React from "react";
import { fontStack, colors, radii, transitions, panelStyle } from "./styleTokens";

export default function ControlsPanel({ selectedFlavor, flavors = [] }) {
  const flavorObj = selectedFlavor ? flavors.find(f => f.name === selectedFlavor) : null;

  const statusBtn = (label, color) => ({
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    background: color.bg,
    border: `1px solid ${color.border}`,
    color: color.text,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: fontStack,
    letterSpacing: ".5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: transitions.base
  });

  return (
    <div style={{ ...panelStyle, padding: 12, fontFamily: fontStack }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        {flavorObj && flavorObj.image && (
          <img
            src={`https://boutique.brets.fr/${flavorObj.image}`}
            alt={flavorObj.name}
            style={{
              width: 46,
              height: 46,
              objectFit: "cover",
              borderRadius: radii.md,
              background: colors.bgSubtle,
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
            }}
            onError={(e)=> e.currentTarget.style.display="none"}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: colors.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {flavorObj ? flavorObj.name : "Toutes les saveurs"}
          </div>
          <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
            Filtrer la carte par disponibilité
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          style={statusBtn("Disponible", {
            bg: "#e8f9ef",
            border: "rgba(47,158,68,0.30)",
            text: colors.success
          })}
        >Disponible</button>
        <button
          style={statusBtn("Indispo", {
            bg: "#ffecec",
            border: "rgba(224,49,49,0.30)",
            text: colors.danger
          })}
        >Indisponible</button>
        <button
          style={statusBtn("Inconnu", {
            bg: colors.neutralChip,
            border: colors.border,
            text: colors.textSoft
          })}
        >Inconnu</button>
      </div>
    </div>
  );
}