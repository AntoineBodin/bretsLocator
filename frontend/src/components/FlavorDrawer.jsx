import React, { useMemo } from "react";
import SearchInput from "./SearchInput";
import { fuzzyMatches } from "../utils/fuzzy";
import { fontStack, colors, radii, softTextStyle } from "./styleTokens";

const Z_INDEX_DRAWER = 1700; // > 1500 (DetailsSection), > 1499 (overlay)

export default function FlavorDrawer({
  open,
  onClose,
  flavors = [],
  // single (legacy)
  selectedFlavor,
  setSelectedFlavor,
  // multi (new)
  selectedFlavors,
  setSelectedFlavors
}) {
  const multi = Array.isArray(selectedFlavors) && typeof setSelectedFlavors === "function";
  const [query, setQuery] = React.useState("");

  const getFlavorId = (f) => f.id ?? f.slug ?? f.name;

  const filtered = React.useMemo(() => {
    if (!query) return flavors;
    const q = query.toLowerCase();
    return flavors.filter(f => (f.name || "").toLowerCase().includes(q));
  }, [flavors, query]);

  // Normalisation sélection
  const currentMulti = multi
    ? selectedFlavors
    : (selectedFlavor ? [selectedFlavor] : []);

  const isSelected = (id) => currentMulti.includes(id);

  const toggleFlavor = (id) => {
    if (multi) {
      const next = isSelected(id)
        ? currentMulti.filter(v => v !== id)
        : [...currentMulti, id];
      setSelectedFlavors(next);
      // SUPPRIMÉ: ne surtout pas réécrire en single ici
      // setSelectedFlavor && setSelectedFlavor(next[0] || null);
    } else {
      setSelectedFlavor && setSelectedFlavor(id === selectedFlavor ? null : id);
    }
  };

  const resetSelection = () => {
    if (multi) {
      setSelectedFlavors([]);
      // SUPPRIMÉ: pas besoin de toucher selectedFlavor
      // setSelectedFlavor && setSelectedFlavor(null);
    } else {
      setSelectedFlavor && setSelectedFlavor(null);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "min(340px, 90vw)",
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          boxShadow: "0 10px 38px -6px rgba(15,23,42,0.4), 0 2px 8px -2px rgba(15,23,42,0.25)",
          borderRight: "1px solid rgba(255,255,255,0.45)",
          transform: open ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 320ms cubic-bezier(.4,0,.2,1)",
            zIndex: Z_INDEX_DRAWER,
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",          // pas de scroll latéral
          overscrollBehavior: "contain"
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: "16px 16px 12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.5)"
          }}
        >
          <strong style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "#0f172a",
            flex: 1,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Saveurs
          </strong>
          {multi && (
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background: currentMulti.length
                ? "rgba(99,102,241,0.15)"
                : "rgba(255,255,255,0.6)",
              color: currentMulti.length ? "#4f46e5" : "#64748b",
              lineHeight: 1
            }}>
              {currentMulti.length}
            </span>
          )}
          <button
            aria-label="Fermer"
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.55)",
              width: 38,
              height: 38,
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 18,
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px -1px rgba(15,23,42,0.18)"
            }}
          >
            ✕
          </button>
        </div>

        {/* Search + reset */}
        <div
          style={{
            padding: "10px 16px 12px 18px",
            display: "flex",
            alignItems: "center",
            // IMPORTANT: empêcher l'input de recouvrir le bouton reset
            gap: 10,
            flexShrink: 0
          }}
        >
          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              // Réserve la place du bouton (42px + gap 10)
              maxWidth: "calc(100% - 52px)",
              position: "relative",
              display: "flex"
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              style={{
                flex: 1,
                minWidth: 0,
                width: "100%",
                padding: "10px 40px 10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.1)",
                background: "rgba(255,255,255,0.7)",
                fontSize: 14,
                outline: "none",
                fontWeight: 500
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Effacer"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#64748b",
                  lineHeight: 1
                }}
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={resetSelection}
            disabled={currentMulti.length === 0 && !query}
            aria-label="Réinitialiser"
            title="Réinitialiser"
            style={{
              flex: "0 0 42px",
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: currentMulti.length || query
                ? "#4f46e5"
                : "rgba(255,255,255,0.65)",
              color: currentMulti.length || query ? "#fff" : "#64748b",
              cursor: currentMulti.length || query ? "pointer" : "default",
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "180ms",
              position: "relative",
              zIndex: 1
            }}
          >
            ⟳
          </button>
        </div>

        {/* Liste */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "4px 14px 18px 18px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
            // masque gradient top/bottom discret
            maskImage: "linear-gradient(180deg,rgba(0,0,0,0.18),#000 28px calc(100% - 28px),rgba(0,0,0,0.18))"
          }}
        >
          {filtered.map(f => {
            const id = getFlavorId(f);
            const active = isSelected(id);
            const img = f.image || f.img || f.thumbnail;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleFlavor(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  height: 72,                  // hauteur fixe
                  boxSizing: "border-box",
                  borderRadius: 18,
                  border: active
                    ? "2px solid #4f46e5"
                    : "1px solid rgba(0,0,0,0.12)",
                  background: active
                    ? "linear-gradient(90deg, rgba(79,70,229,0.12), rgba(79,70,229,0.04))"
                    : "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.6)",
                    flexShrink: 0,
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {img ? (
                    <img
                      src={img.startsWith("http") ? img : `https://boutique.brets.fr/${img}`}
                      alt={f.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#64748b",
                      letterSpacing: ".5px"
                    }}>
                      {(f.name || "?").slice(0,2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Texte + ellipsis */}
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <span style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "18px"
                  }}>
                    {f.name}
                  </span>
                  {f.subtitle && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "14px",
                      marginTop: 2
                    }}>
                      {f.subtitle}
                    </span>
                  )}
                </div>

                {/* Badge sélection multi */}
                {multi && active && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#4f46e5"
                  }}>
                    ✓
                  </span>
                )}

                {/* Overlay check single */}
                {!multi && active && (
                  <span style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(79,70,229,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#4f46e5"
                  }}>✓</span>
                )}
              </button>
            );
          })}

          {!filtered.length && (
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#64748b",
              padding: "12px 4px",
              textAlign: "center"
            }}>
              Aucune saveur
            </div>
          )}
        </div>

        {/* Footer compact */}
        <div
          style={{
            flexShrink: 0,
            padding: "10px 16px 14px 18px",
            borderTop: "1px solid rgba(255,255,255,0.45)",
            display: "flex",
            justifyContent: "space-between",
            gap: 10
          }}
        >
          <button
            onClick={resetSelection}
            disabled={!currentMulti.length}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: currentMulti.length ? "#4f46e5" : "rgba(255,255,255,0.6)",
              color: currentMulti.length ? "#fff" : "#64748b",
              cursor: currentMulti.length ? "pointer" : "default",
              fontSize: 13,
              fontWeight: 600,
              flex: 1,
              transition: "160ms",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.65)",
              color: "#334155",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              flex: "0 0 auto",
              minWidth: 96
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "transparent", // pas d'assombrissement (drawer doit flotter au-dessus)
            zIndex: Z_INDEX_DRAWER - 5
          }}
        />
      )}
    </>
  );
}