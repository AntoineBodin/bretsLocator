import React from "react";
import { useMap } from "react-leaflet";
import { fetchClusters, fetchStoresInBounds } from "../utils/api";
import { CLUSTER_ZOOM_THRESHOLD } from "../utils/config";

// Throttled + debounced map data updater (clusters vs points)

const MIN_FETCH_INTERVAL = 450;          // ms entre deux fetchs (throttle)
const MOVE_THRESHOLD_RATIO = 0.12;       // 12% de la dimension du viewport
const DEBOUNCE_DELAY = 160;              // ms (attendre fin du pan)

export function MapUpdater({
  selectedFlavor,
  selectedFlavors = [],
  onClustersFetched,
  onStoresFetched,
  debounce = DEBOUNCE_DELAY
}) {
  const map = useMap();

  const timerRef = React.useRef(null);
  const lastFetchRef = React.useRef({
    ts: 0,
    zoom: null,
    flavorsKey: "",
    boundsKey: "",
    center: null,
    span: null,
    mode: null // "clusters" | "points"
  });
  const reqIdRef = React.useRef(0);

  // Liste effective des saveurs
  const effectiveFlavors = React.useMemo(() => {
    if (selectedFlavors && selectedFlavors.length) return selectedFlavors;
    return selectedFlavor ? [selectedFlavor] : [];
  }, [selectedFlavor, selectedFlavors]);

  const flavorsKey = React.useMemo(
    () => (effectiveFlavors.length ? effectiveFlavors.slice().sort().join("|") : ""),
    [effectiveFlavors]
  );

  const computeBoundsInfo = React.useCallback((b) => {
    const south = b.getSouth();
    const north = b.getNorth();
    const west = b.getWest();
    const east = b.getEast();
    const centerLat = (south + north) / 2;
    const centerLon = (west + east) / 2;
    const spanLat = Math.abs(north - south);
    const spanLon = Math.abs(east - west);
    return {
      center: { lat: centerLat, lon: centerLon },
      span: { lat: spanLat, lon: spanLon },
      key: `${south.toFixed(5)}|${west.toFixed(5)}|${north.toFixed(5)}|${east.toFixed(5)}`
    };
  }, []);

  const shouldRefetch = React.useCallback((info, zoom, flavorsKey, mode) => {
    const last = lastFetchRef.current;
    const now = Date.now();

    // Throttle strict
    if (now - last.ts < MIN_FETCH_INTERVAL) return false;

    // Changement de mode (clusters/points) => refetch
    if (mode !== last.mode) return true;

    // Changement de zoom => refetch
    if (zoom !== last.zoom) return true;

    // Changement de filtres => refetch
    if (flavorsKey !== last.flavorsKey) return true;

    // Bounds identiques (au granulaire utilisé) => pas besoin
    if (info.key === last.boundsKey) return false;

    // Mouvement significatif?
    if (last.center && last.span) {
      const dLat = Math.abs(info.center.lat - last.center.lat);
      const dLon = Math.abs(info.center.lon - last.center.lon);
      const movedEnough =
        dLat > last.span.lat * MOVE_THRESHOLD_RATIO ||
        dLon > last.span.lon * MOVE_THRESHOLD_RATIO ||
        Math.abs(info.span.lat - last.span.lat) > last.span.lat * 0.02 ||
        Math.abs(info.span.lon - last.span.lon) > last.span.lon * 0.02;
      return movedEnough;
    }
    return true;
  }, []);

  const runFetch = React.useCallback(async () => {
    if (!map) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const boundsInfo = computeBoundsInfo(bounds);
    const mode = zoom <= CLUSTER_ZOOM_THRESHOLD ? "clusters" : "points";

    if (!shouldRefetch(boundsInfo, zoom, flavorsKey, mode)) return;

    const reqId = ++reqIdRef.current;

    const flavorsParam =
      effectiveFlavors.length === 0
        ? null
        : effectiveFlavors.length === 1
        ? effectiveFlavors[0]
        : effectiveFlavors;

    try {
      if (mode === "clusters") {
        const clusters = await fetchClusters(bounds, zoom, flavorsParam);
        if (reqId === reqIdRef.current) {
          onClustersFetched?.(clusters);
          onStoresFetched?.([]);
          lastFetchRef.current = {
            ts: Date.now(),
            zoom,
            flavorsKey,
            boundsKey: boundsInfo.key,
            center: boundsInfo.center,
            span: boundsInfo.span,
            mode
          };
        }
      } else {
        const stores = await fetchStoresInBounds(bounds, flavorsParam);
        if (reqId === reqIdRef.current) {
          onStoresFetched?.(stores);
            onClustersFetched?.([]);
          lastFetchRef.current = {
            ts: Date.now(),
            zoom,
            flavorsKey,
            boundsKey: boundsInfo.key,
            center: boundsInfo.center,
            span: boundsInfo.span,
            mode
          };
        }
      }
    } catch (e) {
      if (reqId === reqIdRef.current) console.error("MapUpdater fetch error", e);
    }
  }, [
    map,
    computeBoundsInfo,
    shouldRefetch,
    effectiveFlavors,
    flavorsKey,
    onClustersFetched,
    onStoresFetched
  ]);

  // Debounce scheduler
  const schedule = React.useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runFetch, debounce);
  }, [runFetch, debounce]);

  // Installer listeners UNE SEULE fois
  React.useEffect(() => {
    if (!map) return;
    const handleMoveEnd = () => schedule();
    const handleZoomEnd = () => schedule();
    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, schedule]);

  // Changement de filtres => reset boundsKey pour forcer fetch immédiat
  React.useEffect(() => {
    // Invalide la clé pour forcer un fetch sans attendre un mouvement
    lastFetchRef.current.boundsKey = "";
    runFetch();
  }, [flavorsKey, runFetch]);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  return null;
}

// Inchangé
export function MapController({ mapRef }) {
  const map = useMap();
  React.useEffect(() => {
    mapRef.current = map;
    return () => {
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [map]);
  return null;
}

// Inchangé (si tu veux)
export function MapZoom() {
  const map = useMap();
  const [zoom, setZoom] = React.useState(map.getZoom());
  React.useEffect(() => {
    const up = () => setZoom(map.getZoom());
    map.on("zoomend", up);
    return () => map.off("zoomend", up);
  }, [map]);
  return (
    <div style={{
      position: "absolute",
      top: 10,
      right: 10,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(6px)",
      padding: "6px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: "system-ui, sans-serif",
      color: "#111",
      boxShadow: "0 4px 14px -4px rgba(0,0,0,0.18)",
      fontWeight: 500
    }}>
      Z {zoom}
    </div>
  );
}