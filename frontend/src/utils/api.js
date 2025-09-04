import { API_URL } from "./config";

function logConnection() {
  fetch(`${API_URL}/connections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function logUpdate(storeId, flavorName, availability) {
  let sessionId = sessionStorage.getItem("sessionId");

  fetch(`${API_URL}/updates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ storeId, flavorName, availability, sessionId })
  });
}

function addFlavorParams(search, flavors) {
  if (!flavors) return;
  if (Array.isArray(flavors)) {
    const clean = flavors.filter(Boolean);
    if (clean.length === 1) search.set("flavor", clean[0]);
    else if (clean.length > 1) search.set("flavors", clean.join(","));
  } else {
    search.set("flavor", flavors);
  }
}

// GET /api/flavors
export async function fetchFlavors() {
  const res = await fetch(`${API_URL}/flavors`);
  if (!res.ok) throw new Error(`Erreur API flavors: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// GET /api/stores (option bbox + flavor|flavors)
export async function fetchStores({ flavors = null } = {}) {
  const url = new URL(`${API_URL}/stores`);
  addFlavorParams(url.searchParams, flavors);
  const r = await fetch(url);
  if (!r.ok) throw new Error("stores failed");
  return r.json();
}

// GET /api/stores/in-bounds?swLat=&swLon=&neLat=&neLon=&cellSize=... (+ flavor(s))
// bounds: Leaflet bounds ou objet {swLat,swLon,neLat,neLon}
export async function fetchStoresInBounds(bounds, flavors = null) {
  const url = new URL(`${API_URL}/stores/in-bounds`);
  if (bounds.getSouth) {
    url.searchParams.set("swLat", bounds.getSouth());
    url.searchParams.set("swLon", bounds.getWest());
    url.searchParams.set("neLat", bounds.getNorth());
    url.searchParams.set("neLon", bounds.getEast());
  } else {
    url.searchParams.set("swLat", bounds.swLat);
    url.searchParams.set("swLon", bounds.swLon);
    url.searchParams.set("neLat", bounds.neLat);
    url.searchParams.set("neLon", bounds.neLon);
  }
  addFlavorParams(url.searchParams, flavors);
  const r = await fetch(url);
  if (!r.ok) throw new Error("in-bounds failed");
  return r.json();
}

// Clustering (si backend identique à in-bounds avec cellSize dynamique)
export async function fetchClusters(bounds, zoom, flavors = null) {
  const url = new URL(`${API_URL}/clusters`);
  url.searchParams.set("zoom", zoom);
  if (bounds.getSouth) {
    url.searchParams.set("swLat", bounds.getSouth());
    url.searchParams.set("swLon", bounds.getWest());
    url.searchParams.set("neLat", bounds.getNorth());
    url.searchParams.set("neLon", bounds.getEast());
  } else {
    url.searchParams.set("swLat", bounds.swLat);
    url.searchParams.set("swLon", bounds.swLon);
    url.searchParams.set("neLat", bounds.neLat);
    url.searchParams.set("neLon", bounds.neLon);
  }
  addFlavorParams(url.searchParams, flavors);
  const r = await fetch(url);
  if (!r.ok) throw new Error("clusters failed");
  return r.json();
}

// GET /api/stores/:id
export async function fetchStoreById(id) {
  const r = await fetch(`${API_URL}/stores/${id}`);
  if (!r.ok) throw new Error("store failed");
  return r.json();
}

/**
 * Calcule le prochain état d'une saveur selon la règle:
 * 0 (INCONNU) -> 1 (DISPONIBLE)
 * 2 (PLUS DISP.) -> 1 (DISPONIBLE)
 * 1 (DISPONIBLE) -> 2 (PLUS DISP.)
 */
export function computeNextAvailability(current) {
  if (current === 1) return 2;
  return 1;
}

/**
 * Met à jour (cycle) l'état d'une saveur pour un magasin.
 * @param {Object} params
 * @param {number|string} params.storeId - ID du magasin
 * @param {string} params.flavorName - Nom (clé) de la saveur
 * @param {number} params.currentAvailability - Statut actuel (0 inconnu, 1 dispo, 2 indispo)
 * @returns {Promise<any>} payload JSON retourné par le backend (ex: nouvel objet storeFlavor)
 *
 * Endpoint attendu (adapter si besoin):
 *   PATCH /api/stores/:storeId/flavors/:flavorName
 * Body JSON: { availability: <number> }
 */
export async function cycleStoreFlavorAvailability({ storeId, flavorName, currentAvailability }) {
  if (storeId == null) throw new Error("storeId requis");
  if (!flavorName) throw new Error("flavorName requis");
  const nextAvailability = computeNextAvailability(currentAvailability);

  const url = `${API_URL}/stores/${storeId}/flavors/${encodeURIComponent(flavorName)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ availability: nextAvailability })
  });
  if (!res.ok) {
    throw new Error(`cycleStoreFlavorAvailability failed: ${res.status}`);
  }
  //logUpdate(storeId, flavorName, nextAvailability);
  
  return res.json();

}
