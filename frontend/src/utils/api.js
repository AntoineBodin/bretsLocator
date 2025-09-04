import { API_URL } from "./config";

export function logConnection() {
  fetch(`${API_URL}/connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
}

function logUpdate(storeId, flavorName, availability) {
  const sessionId = sessionStorage.getItem("sessionId");
  fetch(`${API_URL}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

// Flavors list
export async function fetchFlavors() {
  const res = await fetch(`${API_URL}/flavors`);
  if (!res.ok) throw new Error(`flavors error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// All stores (optional flavor filters)
export async function fetchStores({ flavors = null } = {}) {
  const url = new URL(`${API_URL}/stores`);
  addFlavorParams(url.searchParams, flavors);
  const r = await fetch(url);
  if (!r.ok) throw new Error("stores failed");
  return r.json();
}

// Stores inside bounds
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

// Clusters
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

// Store by id
export async function fetchStoreById(id) {
  const r = await fetch(`${API_URL}/stores/${id}`);
  if (!r.ok) throw new Error("store failed");
  return r.json();
}

// Next availability state (cycle: 0/2 -> 1, 1 -> 2)
export function computeNextAvailability(current) {
  return current === 1 ? 2 : 1;
}

// Cycle store flavor availability and log update
export async function cycleStoreFlavorAvailability({ storeId, flavorName, currentAvailability }) {
  if (storeId == null) throw new Error("storeId required");
  if (!flavorName) throw new Error("flavorName required");
  const nextAvailability = computeNextAvailability(currentAvailability);
  const url = `${API_URL}/stores/${storeId}/flavors/${encodeURIComponent(flavorName)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availability: nextAvailability })
  });
  if (!res.ok) throw new Error(`cycleStoreFlavorAvailability failed: ${res.status}`);
  logUpdate(storeId, flavorName, nextAvailability);
  return res.json();
}

// Admin endpoints
export async function fetchAdminUpdateLogs(password, limit = 50) {
  const url = new URL(`${API_URL}/admin/update-logs`);
  url.searchParams.set('limit', limit);
  const res = await fetch(url, { headers: { 'x-admin-password': password } });
  if (res.status === 401) throw new Error('Invalid password');
  if (!res.ok) throw new Error('update logs error');
  return res.json();
}

export async function fetchAdminConnections(password, limit = 100) {
  const url = new URL(`${API_URL}/admin/connections`);
  url.searchParams.set('limit', limit);
  const res = await fetch(url, { headers: { 'x-admin-password': password } });
  if (res.status === 401) throw new Error('Invalid password');
  if (!res.ok) throw new Error('connections error');
  return res.json();
}

export async function fetchAdminConnectionStats(password, interval = '5m') {
  const url = new URL(`${API_URL}/admin/connections/stats`);
  url.searchParams.set('interval', interval);
  const res = await fetch(url, { headers: { 'x-admin-password': password } });
  if (res.status === 401) throw new Error('Invalid password');
  if (!res.ok) throw new Error('stats error');
  return res.json();
}
