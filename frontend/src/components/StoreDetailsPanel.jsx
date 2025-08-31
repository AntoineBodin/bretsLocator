import React from "react";
import { fontStack, softTextStyle, colors, radii, badgeStyles } from "./styleTokens";

function AvailabilityBadge({ value }) {
  let variant = badgeStyles.neutral;
  let label = "INCONNU";
  if (value === 1) { variant = badgeStyles.success; label = "DISPONIBLE"; }
  else if (value === 2) { variant = badgeStyles.danger; label = "PLUS DISP."; }
  return (
    <span style={{ ...badgeStyles.base, ...variant }}>
      {label}
    </span>
  );
}

export default function StoreDetailsPanel({ selectedStore, onClose, toggleAvailability, sortedFlavorsForRender }) {
  if (!selectedStore) {
    return (
      <div style={{ padding: 14, fontFamily: fontStack, ...softTextStyle }}>
        Aucune sélection — cliquez sur un point.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", padding: 14, gap: 16, fontFamily: fontStack, boxSizing: "border-box" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16, lineHeight: "20px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedStore.name}
            </div>
            <div style={{ ...softTextStyle, marginTop: 4 }}>
              {selectedStore.address ?? "Adresse inconnue"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.bgPanel,
              color: colors.textSoft,
              padding: "6px 10px",
              borderRadius: radii.sm,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".5px"
            }}
          >
            FERMER
          </button>
        </div>

        <div style={{ marginTop: 14, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ overflowY: "auto", paddingRight: 4 }}>
            {sortedFlavorsForRender(selectedStore.storeFlavors || []).map(sf => (
              <div
                key={sf.flavorName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 8px",
                  borderRadius: radii.md,
                  transition: "150ms",
                  background: "rgba(0,0,0,0)",
                }}
              >
                {sf.flavor?.image && (
                  <img
                    src={`https://boutique.brets.fr/${sf.flavor.image}`}
                    alt={sf.flavorName}
                    style={{
                      width: 42,
                      height: 42,
                      objectFit: "cover",
                      borderRadius: radii.sm,
                      background: colors.bgSubtle
                    }}
                    onError={(e)=> e.currentTarget.style.display="none"}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: colors.text,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden"
                  }}>
                    {sf.flavor?.name ?? sf.flavorName}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <AvailabilityBadge value={sf.available} />
                  </div>
                </div>
                <button
                  onClick={() => toggleAvailability(sf.flavorName)}
                  style={{
                    border: `1px solid ${colors.borderStrong}`,
                    background: colors.bgPanel,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: ".5px",
                    color: colors.textSoft,
                    cursor: "pointer",
                    borderRadius: radii.sm,
                    minWidth: 54
                  }}
                >
                  Cycle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}