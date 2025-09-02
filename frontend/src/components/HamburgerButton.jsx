import React from "react";

export default function HamburgerButton({ onClick, open }) {
  return (
    <button
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      onClick={onClick}
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 1200,
        width: 46,
        height: 46,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        fontSize: 20,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1
      }}
    >
      {open ? "✕" : "☰"}
    </button>
  );
}