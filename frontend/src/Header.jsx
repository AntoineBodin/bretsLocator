import React, { useEffect, useState } from "react";

export default function Header({ selectedFlavor, setSelectedFlavor }) {
  const [flavors, setFlavors] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/flavors")
      .then((res) => res.json())
      .then(setFlavors)
      .catch(console.error);
  }, []);

  return (
    <div style={{ display: "flex", gap: "8px", padding: "10px", borderBottom: "1px solid #ccc", overflowX: "auto" }}>
      {flavors.map((flavor) => {
        const isSelected = selectedFlavor === flavor.name;

        return (
          <button
            key={flavor.id}
            onClick={() => setSelectedFlavor(isSelected ? null : flavor.name)}
            style={{
              border: isSelected ? "2px solid #000" : "1px solid #ccc",
              borderRadius: "8px",
              padding: "4px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {flavor.image && <img src={`https://boutique.brets.fr${flavor.image}`} alt={flavor.name} style={{ width: "40px", height: "40px", objectFit: "contain" }} />}
            <div style={{ fontSize: "10px", textAlign: "center" }}>{flavor.name}</div>
          </button>
        );
      })}
    </div>
  );
}
