import React from "react";
import { fontStack, colors, radii, transitions } from "./styleTokens";

export default function SearchInput({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div style={{ position: "relative", fontFamily: fontStack }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
            width: "100%",
            padding: "10px 40px 10px 14px",
            borderRadius: radii.md,
            border: `1px solid ${colors.border}`,
            background: colors.bgPanel,
            fontSize: 14,
            fontFamily: "inherit",
            color: colors.text,
            outline: "none",
            transition: transitions.base,
            boxShadow: "0 1px 0 rgba(15,23,42,0.04)"
        }}
        onFocus={(e)=> e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentSoft}`}
        onBlur={(e)=> e.currentTarget.style.boxShadow = "0 1px 0 rgba(15,23,42,0.04)"}
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            height: 28,
            width: 28,
            borderRadius: radii.sm,
            border: "none",
            background: colors.bgSubtle,
            color: colors.textSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 16,
            fontFamily: "inherit",
            transition: transitions.base
          }}
          onMouseEnter={(e)=> { e.currentTarget.style.background = colors.neutralChip; }}
          onMouseLeave={(e)=> { e.currentTarget.style.background = colors.bgSubtle; }}
        >
          ✕
        </button>
      )}
      <div style={{
        pointerEvents: "none",
        position: "absolute",
        top: "50%",
        right: 40,
        transform: "translateY(-50%)",
        fontSize: 11,
        letterSpacing: ".5px",
        color: colors.textSoft,
        fontWeight: 500,
        fontFamily: "inherit"
      }}>
        CTRL+K
      </div>
    </div>
  );
}