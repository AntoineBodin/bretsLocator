import { API_URL } from "./config";

export async function fetchStores() {
  const res = await fetch(`${API_URL}/stores`);
  if (!res.ok) throw new Error("Erreur API");
  return await res.json();
}

export async function fetchFlavors() {
    const res = await fetch("https://boutique.brets.fr/ws/wsGetProducts.asp");
    if (!res.ok) throw new Error("Erreur API");
    return await res.json();
}