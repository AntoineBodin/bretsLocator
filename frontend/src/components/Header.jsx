import React from "react";
import { fontStack, colors, radii, transitions, panelStyle } from "./styleTokens";

export default function Header({ selectedFlavor, setSelectedFlavor, flavors = [], vertical = false }) {
  const item = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: radii.md,
    border: active ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
    background: active ? colors.accentSoft : colors.bgPanel,
    cursor: "pointer",
    fontFamily: fontStack,
    transition: transitions.base,
    boxShadow: active ? "0 0 0 2px rgba(37,99,235,0.15)" : "0 1px 2px rgba(15,23,42,0.04)",
    width: "100%",
  });

  if (vertical) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 4,
          ...panelStyle,
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      >
        {flavors.map((f) => (
          <button
            key={f.name}
            onClick={() => setSelectedFlavor(f.name)}
            style={item(selectedFlavor === f.name)}
            title={f.name}
          >
            {f.image && (
              <img
                src={`https://boutique.brets.fr/${f.image}`}
                alt={f.name}
                style={{
                  width: 44,
                  height: 44,
                  objectFit: "cover",
                  borderRadius: radii.sm,
                  background: colors.bgSubtle,
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 500,
                color: colors.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.name}
            </div>
          </button>
        ))}
        <button
          onClick={() => setSelectedFlavor(null)}
          style={{
            ...item(false),
            justifyContent: "center",
            fontWeight: 600,
            letterSpacing: ".5px",
          }}
        >
          Réinitialiser
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        padding: 12,
        fontFamily: fontStack,
      }}
    >
      {flavors.map((f) => (
        <button
          key={f.name}
          onClick={() => setSelectedFlavor(f.name)}
          title={f.name}
          style={{ ...item(selectedFlavor === f.name), flex: "0 0 170px" }}
        >
          {f.image && (
            <img
              src={`https://boutique.brets.fr/${f.image}`}
              alt={f.name}
              style={{ width: 38, height: 38, objectFit: "cover", borderRadius: radii.sm, background: colors.bgSubtle }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>
            {f.name}
          </span>
        </button>
      ))}
      <button
        onClick={() => setSelectedFlavor(null)}
        style={{
          ...item(false),
          flex: "0 0 140px",
          fontWeight: 600,
          letterSpacing: ".5px",
        }}
      >
        Toutes
      </button>
    </div>
  );
}
