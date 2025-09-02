import React from "react";
import { fontStack, colors, radii, transitions } from "./styleTokens";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  showShortcut = false // laissé pour desktop futur, ignoré ici (mobile)
}) {
  const inputRef = React.useRef(null);

  return (
    <div
      style={{
        position: "relative",
        fontFamily: fontStack,
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        style={{
          width: "100%",
          padding: "10px 38px 10px 14px",
          borderRadius: radii.md,
          border: `1px solid ${colors.border}`,
          background: colors.bgPanel,
          fontSize: 14,
          fontFamily: "inherit",
          color: colors.text,
          outline: "none",
          transition: transitions.base,
          boxSizing: "border-box",
          WebkitAppearance: "none"
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accentSoft}`;
          e.currentTarget.style.borderColor = colors.accent;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = colors.border;
        }}
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer la recherche"
            onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            height: 26,
            width: 26,
            borderRadius: radii.sm,
            border: "none",
            background: colors.bgSubtle,
            color: colors.textSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "inherit",
            transition: transitions.base
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.neutralChip)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgSubtle)}
        >
          ✕
        </button>
      )}
      {/* Pas de badge CTRL+K en mobile */}
      {showShortcut && false && (
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          top: "50%",
          right: 42,
          transform: "translateY(-50%)",
          fontSize: 11,
          letterSpacing: ".5px",
          color: colors.textSoft,
          fontWeight: 500,
          fontFamily: "inherit"
        }}>
          CTRL+K
        </div>
      )}
    </div>
  );
}