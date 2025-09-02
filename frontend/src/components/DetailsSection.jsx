import React from "react";
import { fontStack, softTextStyle, colors, radii, badgeStyles } from "./styleTokens";

/* Badge */
function AvailabilityBadge({ value }) {
  let variant = badgeStyles.neutral;
  let label = "INCONNU";
  if (value === 1) { variant = badgeStyles.success; label = "DISPONIBLE"; }
  else if (value === 2) { variant = badgeStyles.danger; label = "PLUS DISP."; }
  return <span style={{ ...badgeStyles.base, ...variant }}>{label}</span>;
}

export default function StoreDetailsPanel({
  selectedStore,
  onClose,              // peut être absent
  clearSelection,       // déjà passé par le parent
  toggleAvailability,
  expanded,
  setExpanded
}) {
  // HOOKS
  const [availableFirst, setAvailableFirst] = React.useState(true);
  const listRef = React.useRef(null);
  const touchStartRef = React.useRef(null);
  const lastTouchYRef = React.useRef(null);
  const [isExiting, setIsExiting] = React.useState(false);
  const closeArmRef = React.useRef(false); // double geste pour fermeture finale

  // Fallback: si onClose non fourni, utiliser clearSelection
  const closeSelection = React.useCallback(() => {
    (onClose || clearSelection)?.();
  }, [onClose, clearSelection]);

  // Reset animation quand nouvelle sélection
  React.useEffect(() => {
    if (selectedStore) {
      setIsExiting(false);
      closeArmRef.current = false;
    }
  }, [selectedStore]);

  const sheetHeightCollapsed = 0.62;
  const marginViewport = 12;
  const transitionMs = 300;
  const fadeMs = 260;

  const orderedFlavors = React.useMemo(() => {
    const raw = selectedStore?.storeFlavors || [];
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

  // Animation fermeture
  const closeWithAnimation = React.useCallback(() => {
    if (isExiting || !selectedStore) return;
    setIsExiting(true);
    setTimeout(() => {
      closeSelection(); // utilise fallback sécurisé
    }, 320);
  }, [isExiting, selectedStore, closeSelection]);

  // Rien à afficher
  if (!selectedStore && !isExiting) return null;

  // Helpers
  const expand = () => {
    if (!expanded) {
      setExpanded(true);
      closeArmRef.current = false; // reset
    }
  };
  const collapse = () => {
    if (expanded) {
      setExpanded(false);
      // on vient de passer en mode réduit: il faudra armer avant de fermer
      closeArmRef.current = false;
    }
  };

  // Wheel: ajout hide quand collapsed + scroll up
  const onWheel = (e) => {
    const el = listRef.current;
    if (!el) return;
    if (!expanded) {
      if (e.deltaY > 0) { // vers le bas => expand
        expand();
        return;
      }
      if (e.deltaY < 0) { // vers le haut => tentative fermeture
        if (!closeArmRef.current) {
          // première intention: on "arme" seulement
          closeArmRef.current = true;
          return;
        }
        closeWithAnimation();
        return;
      }
    } else {
      if (e.deltaY < 0 && el.scrollTop === 0) {
        // collapse depuis expanded
        collapse();
        // ne pas armer tout de suite : collapse() a déjà remis closeArmRef à false
      }
    }
  };

  // Touch
  const onTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
    lastTouchYRef.current = touchStartRef.current;
  };
  const onTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    lastTouchYRef.current = currentY;
    const startY = touchStartRef.current;
    if (startY == null) return;
    const delta = startY - currentY; // >0 vers le haut, <0 vers le bas
    const el = listRef.current;
    if (!el) return;

    if (!expanded) {
      if (delta > 14) { // swipe up => expand
        expand();
        touchStartRef.current = currentY;
      } else if (delta < -14) { // swipe down => tentative fermeture
        if (!closeArmRef.current) {
          closeArmRef.current = true; // on arme
        } else {
          closeWithAnimation();
        }
        touchStartRef.current = currentY;
      }
    } else {
      if (delta < -14 && el.scrollTop === 0) {
        collapse();
        touchStartRef.current = currentY;
      }
    }
  };
  const onTouchEnd = () => {
    touchStartRef.current = null;
    lastTouchYRef.current = null;
  };

  // Dimensions
  const panelHeight = expanded
    ? `calc(100vh - ${marginViewport * 2}px)`
    : `calc(${sheetHeightCollapsed * 100}vh)`;
  const panelTop = expanded
    ? `${marginViewport}px`
    : `calc(100vh - ${panelHeight})`;
  const panelWidth = `min(450px, calc(100vw - ${marginViewport * 2}px))`;
  const panelRight = `${marginViewport}px`;

  const glassBg = "rgba(255,255,255,0.70)";
  const glassBorder = "rgba(255,255,255,0.35)";

  // Anim état sortie
  const opacity = isExiting ? 0 : 1;
  const translateY = isExiting ? 12 : 0;
  const scale = isExiting ? 0.97 : 1;

  return (
    <>
      {expanded && !isExiting && (
        <div
          onClick={closeWithAnimation}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.28)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1499,
            opacity,
            transition: `opacity ${fadeMs}ms ease`
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: panelTop,
          right: panelRight,
          height: panelHeight,
          width: panelWidth,
          zIndex: 1500,
          display: "flex",
          flexDirection: "column",
          borderRadius: 28,
          boxShadow: "0 12px 36px -8px rgba(15,23,42,0.35)",
          background: glassBg,
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          border: `1px solid ${glassBorder}`,
          overflow: "hidden",
          transition: `
            top ${transitionMs}ms cubic-bezier(.4,0,.2,1),
            height ${transitionMs}ms cubic-bezier(.4,0,.2,1),
            width ${transitionMs}ms cubic-bezier(.4,0,.2,1),
            opacity ${fadeMs}ms ease,
            transform ${fadeMs}ms cubic-bezier(.4,0,.2,1)
          `,
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          pointerEvents: isExiting ? "none" : "auto"
        }}
      >
        {/* Handle / toggle expand & collapse */}
        <div
          onClick={() => (expanded ? collapse() : expand())}
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 54,
            height: 5,
            borderRadius: 3,
            background: "rgba(0,0,0,0.15)",
            cursor: "pointer"
          }}
          aria-label={expanded ? "Réduire" : "Déployer"}
        />

        {/* Header + tri */}
        <div
          style={{
            flexShrink: 0,
            padding: "22px 18px 10px 18px",
            paddingTop: 24,
            fontFamily: fontStack
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
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
                {selectedStore?.name ?? ""}
              </div>
              <div style={{ ...softTextStyle, marginTop: 4 }}>
                {selectedStore?.address ?? ""}
              </div>
            </div>
            <button
              onClick={closeWithAnimation}
              style={{
                border: `1px solid ${colors.border}`,
                background: "rgba(255,255,255,0.5)",
                color: colors.textSoft,
                padding: "6px 12px",
                borderRadius: radii.sm,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".5px",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)"
              }}
            >
              FERMER
            </button>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".5px", color: colors.textSoft }}>
              Tri
            </div>
            <div
              role="group"
              aria-label="Ordre des saveurs"
              style={{
                display: "inline-flex",
                background: "rgba(255,255,255,0.55)",
                border: `1px solid ${glassBorder}`,
                borderRadius: 999,
                padding: 2,
                gap: 2,
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)"
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
        </div>

        {/* Liste */}
        <div
          ref={listRef}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "4px 14px 18px 18px",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            maskImage: expanded
              ? "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,1) 32px)"
              : "none",
            touchAction: "pan-y"
          }}
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
                background: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.4)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                marginBottom: 6
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
                    background: colors.bgSubtle,
                    flexShrink: 0
                  }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
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
                  background: "rgba(255,255,255,0.55)",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".5px",
                  color: colors.textSoft,
                  cursor: "pointer",
                  borderRadius: radii.sm,
                  minWidth: 54,
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)"
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
    </>
  );
}