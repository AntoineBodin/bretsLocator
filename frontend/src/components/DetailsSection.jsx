import React from "react";
import { fontStack } from "./styleTokens"; // conserve si utile ailleurs
import { cycleStoreFlavorAvailability } from "../utils/api";
import {
  TOAST_DURATION,
  PANEL_MARGIN,              // peut rester si utilisé ailleurs
  SHEET_HEIGHT_COLLAPSED_RATIO,
  PANEL_TRANSITION_MS,
  PANEL_FADE_MS
} from "../utils/constants";
import "../styles/main.scss";
import SearchInput from "./SearchInput";

/* Badge */
function AvailabilityBadge({ value }) {
  let cls = "badge badge--unknown";
  let label = "INCONNU";
  if (value === 1) {
    cls = "badge badge--available";
    label = "DISPONIBLE";
  } else if (value === 2) {
    cls = "badge badge--unavailable";
    label = "PLUS DISP.";
  }
  return <span className={cls}>{label}</span>;
}

export default function StoreDetailsPanel(props) {
  // HOOKS
  const [availableFirst, setAvailableFirst] = React.useState(true);
  const listRef = React.useRef(null);
  const touchStartRef = React.useRef(null);
  const lastTouchYRef = React.useRef(null);
  const [isExiting, setIsExiting] = React.useState(false);
  const closeArmRef = React.useRef(false); // double geste pour fermeture finale
  const [localFlavors, setLocalFlavors] = React.useState([]);
  const [pending, setPending] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);

  function computeNext(cur) {
    return cur === 1 ? 2 : 1;
  }

  // Wrapper fermeture (remplace closeSelection manquant)
  const closeSelection = React.useCallback(() => {
    if (props.onClose) props.onClose();
    if (props.clearSelection) props.clearSelection();
  }, [props.onClose, props.clearSelection]);

  // Sync local flavors quand on change de store
  React.useEffect(() => {
    setLocalFlavors(props.selectedStore?.storeFlavors || []);
    setPending([]);
  }, [props.selectedStore]);

  // Planifie la mise à jour avec délai annulable (toast)
  const scheduleCycle = React.useCallback((sf) => {
    const already = pending.find(p => p.flavorName === sf.flavorName);
    if (already) return;

    const originalAvailability = sf.available;
    const targetAvailability = computeNext(originalAvailability);

    // optimistic UI
    setLocalFlavors(list =>
      list.map(f =>
        f.flavorName === sf.flavorName
          ? { ...f, available: targetAvailability }
          : f
      )
    );

    const timeoutId = setTimeout(async () => {
      try {
        await cycleStoreFlavorAvailability({
          storeId: sf.storeId,
            flavorName: sf.flavorName,
            currentAvailability: originalAvailability
        });
      } catch (e) {
        console.error("Erreur maj disponibilité", e);
        // revert if backend error
        setLocalFlavors(list =>
          list.map(f =>
            f.flavorName === sf.flavorName
              ? { ...f, available: originalAvailability }
              : f
          )
        );
      } finally {
        setPending(p => p.filter(x => x.flavorName !== sf.flavorName));
      }
    }, TOAST_DURATION);

    setPending(p => [
      ...p,
      {
        flavorName: sf.flavorName,
        storeId: sf.storeId,
        originalAvailability,
        targetAvailability,
        timeoutId,
        startedAt: Date.now(),
        duration: TOAST_DURATION
      }
    ]);
  }, [pending]);

  const undoPending = React.useCallback((flavorName) => {
    setPending(p => {
      const found = p.find(x => x.flavorName === flavorName);
      if (found) clearTimeout(found.timeoutId);
      // revert UI
      setLocalFlavors(list =>
        list.map(f =>
          f.flavorName === flavorName
            ? { ...f, available: found.originalAvailability }
            : f
        )
      );
      return p.filter(x => x.flavorName !== flavorName);
    });
  }, []);

  // Cleanup timeouts unmount
  React.useEffect(() => {
    return () => {
      pending.forEach(p => clearTimeout(p.timeoutId));
    };
  }, [pending]);

  // Remplacer orderedFlavors source par localFlavors
  const orderedFlavors = React.useMemo(() => {
    const raw = localFlavors || [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? raw.filter(f =>
          (f.flavor?.name || f.flavorName || "")
            .toLowerCase()
            .includes(q)
        )
      : raw;
    const rankAvail = v => (v === 1 ? 0 : v === 0 ? 1 : 2);
    const rankUnavail = v => (v === 2 ? 0 : v === 0 ? 1 : 2);
    const rankFn = availableFirst ? rankAvail : rankUnavail;
    return [...filtered].sort((a, b) => {
      const r = rankFn(a.available) - rankFn(b.available);
      if (r !== 0) return r;
      return (a.flavor?.name || a.flavorName).localeCompare(b.flavor?.name || b.flavorName);
    });
  }, [localFlavors, availableFirst, searchQuery]);

  // Animation fermeture
  const closeWithAnimation = React.useCallback(() => {
    if (isExiting || !props.selectedStore) return;
    setIsExiting(true);
    setTimeout(() => {
      closeSelection();      // enlève le store sélectionné
      setIsExiting(false);   // reset pour permettre ré-ouverture
    }, 320);
  }, [isExiting, props.selectedStore, closeSelection]);

  // Remplacer l'ancienne ligne:
  // if (!selectedStore && !isExiting) return null;
  if (!props.selectedStore) return null;

  // Helpers
  const expand = () => {
    if (!props.expanded) {
      props.setExpanded(true);
      closeArmRef.current = false; // reset
    }
  };
  const collapse = () => {
    if (props.expanded) {
      props.setExpanded(false);
      // on vient de passer en mode réduit: il faudra armer avant de fermer
      closeArmRef.current = false;
    }
  };

  // Wheel: ajout hide quand collapsed + scroll up
  const onWheel = (e) => {
    const el = listRef.current;
    if (!el) return;
    if (!props.expanded) {
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

    if (!props.expanded) {
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

  const panelClasses = [
    "store-details",
    props.expanded ? "store-details--expanded" : "",
    isExiting ? "is-exiting" : ""
  ].join(" ").trim();

  return (
    <>
      {props.expanded && !isExiting && (
        <div
          className={`store-details__overlay ${isExiting ? "is-exiting" : ""}`}
          onClick={closeWithAnimation}
        />
      )}

      <div className={panelClasses}>
        <div
          className="store-details__handle"
          onClick={() => (props.expanded ? collapse() : expand())}
          aria-label={props.expanded ? "Réduire" : "Déployer"}
        />

        <div className="store-details__header">
          <div className="store-details__header-top">
            <div className="store-details__title-wrap">
              <div className="store-details__title">
                {props.selectedStore?.name ?? ""}
              </div>
              <div className="store-details__address">
                {props.selectedStore?.address ?? ""}
              </div>
            </div>
            <button
              onClick={closeWithAnimation}
              className="store-details__close-btn"
            >
              FERMER
            </button>
          </div>

          <div className="store-details__toolbar">
            <div className="store-details__sort-block">
              <span className="sort-group__label">Tri</span>
              <div className="sort-group" role="group" aria-label="Ordre des saveurs">
                <button
                  type="button"
                  aria-pressed={availableFirst}
                  onClick={() => setAvailableFirst(true)}
                  className={`sort-group__btn ${availableFirst ? "is-active" : ""}`}
                >
                  Dispo
                </button>
                <button
                  type="button"
                  aria-pressed={!availableFirst}
                  onClick={() => setAvailableFirst(false)}
                  className={`sort-group__btn ${!availableFirst ? "is-active" : ""}`}
                >
                  Indispo
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showSearch) {
                  setShowSearch(false);
                  setSearchQuery("");
                } else {
                  setShowSearch(true);
                }
              }}
              aria-pressed={showSearch}
              aria-label={showSearch ? "Masquer la recherche" : "Afficher la recherche"}
              title={showSearch ? "Masquer la recherche" : "Afficher la recherche"}
              className={`store-details__search-toggle ${showSearch ? "is-active" : ""}`}
            >
              🔍
            </button>

            {showSearch && (
              <div className="store-details__search-wrapper">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                />
              </div>
            )}
          </div>
        </div>

        <div
          ref={listRef}
          className="store-details__list"
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {orderedFlavors.map(sf => {
            const pendingEntry = pending.find(p => p.flavorName === sf.flavorName);
            const isAvailable = sf.available === 1;
            const willBecomeAvailable = !isAvailable;
            const cycleLabel = willBecomeAvailable ? "Marquer dispo" : "Marquer indispo";
            const cycleShort = pendingEntry ? "En attente…" : (willBecomeAvailable ? "→ Dispo" : "→ Indispo");
            const btnClass = "flavor-action-btn " + (willBecomeAvailable ? "flavor-action-btn--to-available" : "flavor-action-btn--to-unavailable");
            const icon = willBecomeAvailable ? "✓" : "✕";
            return (
              <div
                key={sf.flavorName}
                className={`flavor-item ${pendingEntry ? "is-pending" : ""}`}
              >
                {sf.flavor?.image && (
                  <img
                    src={`https://boutique.brets.fr/${sf.flavor.image}`}
                    alt={sf.flavorName}
                    className="flavor-item__image"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div className="flavor-item__info">
                  <div className="flavor-item__name">
                    {sf.flavor?.name ?? sf.flavorName}
                  </div>
                  <div className="flavor-item__badge">
                    <AvailabilityBadge value={sf.available} />
                  </div>
                </div>
                <button
                  disabled={!!pendingEntry}
                  onClick={() => scheduleCycle(sf)}
                  aria-label={cycleLabel}
                  title={pendingEntry ? "En attente (annulable)" : cycleLabel}
                  className={btnClass}
                >
                  <span className="flavor-action-btn__icon">{icon}</span>
                  {cycleShort}
                </button>
              </div>
            );
          })}

          {!orderedFlavors.length && (
            <div className="store-details__empty">
              Aucune saveur listée.
            </div>
          )}

          {pending.length > 0 && (
            <div className="toast-stack">
              {pending.map(p => (
                <div key={p.flavorName} className="toast">
                  <div className="toast__title">Modification en attente</div>
                  <div className="toast__body">
                    {p.flavorName} → {p.targetAvailability === 1 ? "DISPONIBLE" : "PLUS DISP."}
                  </div>
                  <button
                    className="toast__undo"
                    onClick={() => undoPending(p.flavorName)}
                  >
                    ANNULER
                  </button>
                  <div
                    className="toast__progress"
                    style={{ animationDuration: `${p.duration}ms` }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}