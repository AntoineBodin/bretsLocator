import React from "react";
import { useEffect, useState } from "react";
import { fetchStores } from "./api";

const flavorsOrder = ["Poulet braisé", "Nature", "Fromage", "Paprika", "Ciboulette"]; // ajuste selon ta base

function FlavorTile({ flavor }) {
  let style = {
    width: "80px",
    height: "60px",
    margin: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "12px",
    textAlign: "center",
    backgroundColor: "#f0f0f0",
    color: "#000"
  };

  // dispo
  if (flavor.available === 1) {
    style.backgroundColor = "#b6f5b6"; // vert clair
    style.color = "#000";
  }
  // plus dispo
  if (flavor.available === 2) {
    style.backgroundColor = "#f5b6b6"; // rouge clair
    style.color = "#900";
  }

  return <div style={style}>{flavor.name}</div>;
}

export default function App() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchStores().then(setStores).catch(console.error);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Magasins Bret's</h1>
      {stores.map(store => (
        <div key={store.id} style={{ marginBottom: "30px" }}>
          <h2>{store.name}</h2>
          <p>{store.address}</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {flavorsOrder.map(fName => {
              const sf = store.storeFlavors.find(sf => sf.flavor.name === fName);
              const flavor = sf
                ? { name: sf.flavor.name, available: sf.available }
                : { name: fName, available: 0 }; // 0 = jamais dispo

              return <FlavorTile key={fName} flavor={flavor} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}