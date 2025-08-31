import React from "react";
import { useMapEvents, useMap } from "react-leaflet";
import { fetchClusteredStores } from "../utils/api";;
import { colors, fontStack, radii, shadows } from "./styleTokens";

export function MapUpdater({ selectedFlavor, onStoresFetched, debounce = 120 }) {
  const tRef = React.useRef();
  const run = (map) => {
    clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => {
      try {
        const data = await fetchClusteredStores(map.getBounds(), map.getZoom(), selectedFlavor);
        onStoresFetched(data);
      } catch (e) { console.error(e); }
    }, debounce);
  };
  const map = useMapEvents({ moveend: () => run(map), zoomend: () => run(map) });
  React.useEffect(()=> { if (map) run(map); }, [selectedFlavor]);
  React.useEffect(()=> () => clearTimeout(tRef.current), []);
  return null;
}

export function MapController({ mapRef }) {
  const map = useMap();
  React.useEffect(()=> {
    mapRef.current = map;
    return () => { if (mapRef.current === map) mapRef.current = null; };
  },[map]);
  return null;
}

export function MapZoom() {
  const map = useMap();
  const [zoom,setZoom] = React.useState(map.getZoom());
  React.useEffect(()=> {
    const up = () => setZoom(map.getZoom());
    map.on("zoomend", up);
    return ()=> map.off("zoomend", up);
  },[map]);
  return (
    <div style={{
      position: "absolute",
      top: 10,
      right: 10,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(6px)",
      padding: "6px 10px",
      borderRadius: radii.sm,
      fontSize: 12,
      fontFamily: fontStack,
      color: colors.text,
      boxShadow: shadows.soft,
      fontWeight: 500
    }}>
      Z {zoom}
    </div>
  );
}