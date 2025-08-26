import React, { useEffect, useState } from "react";
import Header from "./Header";
import StoreMapComponent from "./StoreMapComponent";
import { fetchStores } from "./api";

export default function App() {
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const t0 = performance.now();

    async function load() {
      try {
        const data = await fetchStores();
        if (!mounted) return;
        setStores(data);
        console.log(`Stores reçus: ${data.length} (fetch ${(performance.now() - t0).toFixed(0)}ms)`);
      } catch (err) {
        console.error("fetchStores failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <Header selectedFlavor={selectedFlavor} setSelectedFlavor={setSelectedFlavor} />
      {loading && <div>Chargement des stores…</div>}
      <StoreMapComponent stores={stores} selectedFlavor={selectedFlavor} />
    </div>
  );
}
