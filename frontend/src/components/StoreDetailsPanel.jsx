import React from "react";
import { fontStack, softTextStyle, colors, radii, badgeStyles } from "./styleTokens";

function AvailabilityBadge({ value }) {
  let variant = badgeStyles.neutral;
  let label = "INCONNU";
  if (value === 1) { variant = badgeStyles.success; label = "DISPONIBLE"; }
  else if (value === 2) { variant = badgeStyles.danger; label = "PLUS DISP."; }
  return <span style={{ ...badgeStyles.base, ...variant }}>{label}</span>;
}

export default function StoreDetailsPanel({
  selectedStore,
  onClose,
  toggleAvailability,
  onInnerScroll // optionnel
}) {
  const [availableFirst, setAvailableFirst] = React.useState(true);

  const orderedFlavors = React.useMemo(() => {
    const raw = selectedStore?.storeFlavors || [];
    if (!raw.length) return [];
    const list = [...raw];
    const rankAvail = v => (v === 1 ? 0 : v === 0 ? 1 : 2);
    const rankUnavail = v => (v === 2 ? 0 : v === 0 ? 1 : 2);
    const rankFn = availableFirst ? rankAvail : rankUnavail;
    list.sort((a, b) => {
      const r = rankFn(a.available) - rankFn(b.available);
      if (r !== 0) return r;
      return (a.flavor?.name || a.flavorName).localeCompare(b.flavor?.name || b.flavorName);
    });
    return list;
  }, [selectedStore, availableFirst]);

  if (!selectedStore) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 420,
        maxWidth: "100%",
        padding: 20,
        boxSizing: "border-box",
        background: colors.bgPanel,
        borderTopLeftRadius: 28,
        borderBottomLeftRadius: 28,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontFamily: fontStack,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.textSoft,
        zIndex: 1500
      }}>
        Aucune sélection — cliquez sur un point.
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 440,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        gap: 16,
        fontFamily: fontStack,
        boxSizing: "border-box",
        background: colors.bgPanel,
        borderTopLeftRadius: 28,
        borderBottomLeftRadius: 28,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 1500,
        overflow: "hidden"
      }}
    >
      {/* Barre de traction */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 14,
        width: 44,
        height: 4,
        borderRadius: 2,
        background: colors.border,
        opacity: 0.55
      }} />

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 18,
              lineHeight: "22px",
              color: colors.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
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
              padding: "6px 12px",
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

        {/* Toggle tri */}
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".5px", color: colors.textSoft }}>
            Tri
          </div>
          <div
            role="group"
            aria-label="Ordre des saveurs"
            style={{
              display: "inline-flex",
              background: colors.bgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              padding: 2,
              gap: 2
            }}
          >
            <button
              type="button"
              aria-pressed={availableFirst}
              onClick={() => setAvailableFirst(true)}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".5px",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                background: availableFirst ? colors.accent : "transparent",
                color: availableFirst ? "#fff" : colors.textSoft,
                transition: "150ms"
              }}
            >
              Disponibles
            </button>
            <button
              type="button"
              aria-pressed={!availableFirst}
              onClick={() => setAvailableFirst(false)}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".5px",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                background: !availableFirst ? colors.accent : "transparent",
                color: !availableFirst ? "#fff" : colors.textSoft,
                transition: "150ms"
              }}
            >
              Indisponibles
            </button>
          </div>
        </div>

        {/* Liste scrollable (fusion des deux div) */}
        <div
          style={{
            marginTop: 16,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            paddingRight: 6,
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y"
          }}
          onScroll={onInnerScroll}
        >
          {orderedFlavors.map(sf => (
            <div
              key={sf.flavorName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 8px",
                borderRadius: radii.md,
                transition: "150ms",
                background: "transparent"
              }}
            >
              {sf.flavor?.image && (
                <img
                  src={`https://boutique.brets.fr/${sf.flavor.image}`}
                  alt={sf.flavorName}
                  style={{
                    width: 44,
                    height: 44,
                    objectFit: "cover",
                    borderRadius: radii.sm,
                    background: colors.bgSubtle
                  }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: colors.text,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden"
                  }}
                >
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
          {!orderedFlavors.length && (
            <div style={{ ...softTextStyle, padding: "8px 4px" }}>
              Aucune saveur listée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}