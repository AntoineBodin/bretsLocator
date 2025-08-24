import { API_URL } from "./config";

export async function fetchStores() {
  const res = await fetch(`${API_URL}/stores`);
  if (!res.ok) throw new Error("Erreur API");
  return await res.json();
}