import React from "react";
import "../styles/main.scss";
export function FlavorDrawerButton({
  open,
  count = 0,
  onClick,
  multi = false
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flavor-drawer-toggle ${open ? "is-active" : ""}`}
    >
      <span className="flavor-drawer-toggle__bg" aria-hidden="true" />
      <span className="flavor-drawer-toggle__icon" aria-hidden="true">
  {/* Icon */}
        <svg
          className="flavor-drawer-toggle__svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5" cy="7" r="2" />
            <path d="M10 7h9" />
          <circle cx="5" cy="12" r="2" />
            <path d="M10 12h9" />
          <circle cx="5" cy="17" r="2" />
            <path d="M10 17h9" />
        </svg>
      </span>
      <span className="flavor-drawer-toggle__label">
  {open ? "Fermer" : "Trouver une saveur"}
      </span>
      {multi && !!count && (
        <span className="flavor-drawer-toggle__badge">{count}</span>
      )}
    </button>
  );
}

export default function FlavorDrawer({
  open,
  onClose,
  flavors = [],
  selectedFlavor,
  setSelectedFlavor,
  selectedFlavors,
  setSelectedFlavors,
  fullHeight = true
}) {
  const multi = Array.isArray(selectedFlavors) && typeof setSelectedFlavors === "function";
  const [query, setQuery] = React.useState("");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const getFlavorId = f => f.id ?? f.slug ?? f.name;

  const filtered = React.useMemo(() => {
    if (!query) return flavors;
    const q = query.toLowerCase();
    return flavors.filter(f => (f.name || "").toLowerCase().includes(q));
  }, [flavors, query]);

  const currentMulti = multi ? selectedFlavors : (selectedFlavor ? [selectedFlavor] : []);
  const isSelected = id => currentMulti.includes(id);

  const toggleFlavor = (id) => {
    if (multi) {
      const next = isSelected(id)
        ? currentMulti.filter(v => v !== id)
        : [...currentMulti, id];
      setSelectedFlavors(next);
    } else {
      setSelectedFlavor && setSelectedFlavor(id === selectedFlavor ? null : id);
    }
  };

  const resetSelection = () => {
    if (multi) setSelectedFlavors([]);
    else setSelectedFlavor && setSelectedFlavor(null);
    setQuery("");
  };

  const hasActiveReset = currentMulti.length > 0 || !!query;

  const drawerClass = [
    "flavor-drawer",
    fullHeight ? "flavor-drawer--full" : "",
    open ? "is-open" : ""
  ].join(" ");

  return (
    <>
      <div
        className={`flavor-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        role="dialog"
        aria-hidden={!open}
  aria-label="Sélecteur de saveurs"
        className={drawerClass}
        onClick={e => e.stopPropagation()}
      >
        <div className="flavor-drawer__header">
          <strong className="flavor-drawer__title">Saveurs {hasActiveReset ? `(${filtered.length})` : ''}</strong>
          {multi && (
            <span className={`flavor-drawer__count ${currentMulti.length ? "has-selection" : ""}`}>
              {currentMulti.length}
            </span>
          )}
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="flavor-drawer__close"
          >
            ✕
          </button>
        </div>

        <div className="flavor-drawer__controls">
          <div className="flavor-drawer__search-wrap">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flavor-drawer__search-input"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Effacer"
                className="flavor-drawer__search-clear"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={resetSelection}
            aria-label="Réinitialiser"
            title="Réinitialiser"
            className={`flavor-drawer__reset ${hasActiveReset ? "is-active" : ""}`}
            disabled={!hasActiveReset}
          >
            ⟳
          </button>
        </div>

        <div className="flavor-drawer__list">
          {filtered.map(f => {
            const id = getFlavorId(f);
            const active = isSelected(id);
            const img = f.image || f.img || f.thumbnail;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleFlavor(id)}
                className={`flavor-drawer__flavor ${active ? "is-selected" : ""}`}
              >
                <div className="flavor-drawer__img">
                  {img ? (
                    <img
                      src={img.startsWith("http") ? img : `https://boutique.brets.fr/${img}`}
                      alt={f.name}
                      onError={e => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="flavor-drawer__img-fallback">
                      {(f.name || "?").slice(0,2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flavor-drawer__text">
                  <span className="flavor-drawer__name">{f.name}</span>
                  {f.subtitle && (
                    <span className="flavor-drawer__subtitle">{f.subtitle}</span>
                  )}
                </div>
                {multi && active && <span className="flavor-drawer__check">✓</span>}
                {!multi && active && <span className="flavor-drawer__overlay">✓</span>}
              </button>
            );
          })}
          {!filtered.length && (
            <div className="flavor-drawer__empty">Aucune saveur</div>
          )}
        </div>

        <div className="flavor-drawer__footer">
          <button
            onClick={onClose}
            className="flavor-drawer__footer-btn"
          >
            Valider
          </button>
        </div>
      </aside>
    </>
  );
}

// End