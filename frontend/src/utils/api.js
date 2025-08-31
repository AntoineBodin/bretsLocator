import { API_URL } from "./config";

export async function fetchStores(bbox, flavor = null) {
  const url = new URL(`${API_URL}/stores`);
  if (bbox) url.searchParams.set("bbox", bbox.join(","));
  if (flavor) url.searchParams.set("flavor", flavor);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.json();
}

export async function fetchFlavors() {
    const res = await fetch(`${API_URL}/flavors-simple`);
    if (!res.ok) throw new Error("Erreur API");
    return await res.json();
}

export async function fetchStoresInBounds(bounds, flavor = null) {
  const params = new URLSearchParams({
    swLat: bounds.swLat, // south
    swLon: bounds.swLon, // west
    neLat: bounds.neLat, // north
    neLon: bounds.neLon, // east
  });

  console.log("fetch with params:", params.toString());
  if (flavor) params.set("flavor", flavor);

  const res = await fetch(`${API_URL}/stores-in-bounds?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.json();
}

export async function fetchClusteredStores(bounds, zoom, flavor = null) {
  const gridSize = getGridSizeFromZoom(zoom);
  const params = new URLSearchParams({
    swLat: bounds.getSouth(),
    swLon: bounds.getWest(),
    neLat: bounds.getNorth(),
    neLon: bounds.getEast(),
    cellSize: gridSize
  });

  if (flavor) params.set("flavor", flavor);

  const res = await fetch(`${API_URL}/stores-in-bounds?${params.toString()}`);
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  return await res.json();
}

export async function fetchStoreById(id) {
  const res = await fetch(`${API_URL}/store/${id}`);
  if (!res.ok) throw new Error(`Fetch store failed: ${res.status}`);
  return await res.json();
}

// Exemple de fonction de conversion zoom → gridSize
function getGridSizeFromZoom(zoom) {
  if (zoom >= 16) return 0.0001;
  if (zoom >= 12) return 0.01;
  if (zoom === 11) return 0.02;
  if (zoom === 10) return 0.15;
  if (zoom === 9) return 0.25;
  if (zoom === 8) return 0.25;
  if (zoom === 7) return 0.5;
  if (zoom === 6) return 1;
  if (zoom <= 5) return 5;
  return 0.5;
}
