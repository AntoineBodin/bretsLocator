import React from "react";
import { fontStack, colors, radii, transitions } from "./styleTokens";
import "../styles/main.scss";

export default function SearchInput({ value, onChange, onClear }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div className={`search-box ${focus ? "search-box--focus" : ""}`}>
      <span className="search-box__icon">🔍</span>
      <input
        className="search-box__input"
        value={value}
        placeholder="Rechercher..."
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value && (
        <button
          className="search-box__clear"
          onClick={() => onClear?.()}
          aria-label="Effacer"
        >
          ×
        </button>
      )}
    </div>
  );
}