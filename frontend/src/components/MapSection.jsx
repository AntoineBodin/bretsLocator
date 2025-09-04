import L from "leaflet";
import React, { useEffect, useMemo, useState, useRef, useEffect as useReactEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker } from "react-leaflet";
import { MapController, MapZoom } from "./MapHelpers";
import StoreMarkers from "./StoreMarkers";
import "../styles/main.scss";

function InteractionListener({ onUserMapInteraction }) {
  useMapEvents({
    dragstart: () => onUserMapInteraction?.(),
    zoomstart:  () => onUserMapInteraction?.(),
    movestart:  () => onUserMapInteraction?.()
  });
  return null;
}

function ClusterMarker({ cluster, onClick }) {
  const { count, lat, lon } = cluster;

  // Taille FIXE (tous identiques)
  const visual = useMemo(() => {
    const size = 35; // px (ajuste si tu veux plus petit ou plus grand)
    // (Option) garder une couleur selon le nombre, sinon mets une palette fixe
    let stops;
    if (count < 5) stops = ["#0ea5e9", "#0369a1"];
    else if (count < 20) stops = ["#6366f1", "#4338ca"];
    else if (count < 50) stops = ["#8b5cf6", "#6d28d9"];
    else if (count < 120) stops = ["#d946ef", "#a21caf"];
    else stops = ["#fb7185", "#be123c"];
    return {
      size,
      gradient: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 100%)`
    };
  }, [count]);

  const icon = useMemo(() => {
    const { size, gradient } = visual;
    const innerSize = size - 10; // anneau constant
    return L.divIcon({
      className: "cluster-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `
        <div class="cluster-wrap" style="width:${size}px;height:${size}px;">
          <div class="cluster-core" style="
            width:${innerSize}px;
            height:${innerSize}px;
            background:${gradient};
            box-shadow:0 4px 10px -2px rgba(0,0,0,0.35),0 0 0 4px rgba(255,255,255,0.35);
          ">
            <span class="cluster-count">${count}</span>
          </div>
        </div>`
    });
  }, [visual, count]);

  useEffect(() => {
    if (document.getElementById("cluster-marker-styles")) return;
    const style = document.createElement("style");
    style.id = "cluster-marker-styles";
    style.textContent = `
      .cluster-marker{animation:cluster-pop 240ms cubic-bezier(.4,0,.2,1);cursor:pointer;}
      .cluster-marker .cluster-wrap{position:relative;display:grid;place-items:center;border-radius:50%;}
      .cluster-marker .cluster-core{border-radius:50%;display:flex;align-items:center;justify-content:center;
        transition:transform 160ms ease,box-shadow 200ms ease;font-family:system-ui,sans-serif;}
      .cluster-marker .cluster-count{font-size:14px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);letter-spacing:.5px;user-select:none;}
      .cluster-marker:hover .cluster-core{transform:scale(1.08);box-shadow:0 6px 16px -4px rgba(0,0,0,.45),0 0 0 6px rgba(255,255,255,.4);}
      @keyframes cluster-pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      eventHandlers={{ click: () => onClick?.(cluster) }}
    />
  );
}

export default function MapSection({
  mapRef,
  clusters = [],
  stores = [],
  onClusterClick,
  onStoreSelect,
  expanded,
  onUserMapInteraction,
  children
}) {
  const safeClusters = Array.isArray(clusters) ? clusters : [];
  const safeStores   = Array.isArray(stores) ? stores : [];
  const showClusters = safeClusters.length > 0;

  // ==== NEW: user location handling ====
  const DEFAULT_CENTER = [48.8566, 2.3522];
  const [userCenter, setUserCenter] = useState(DEFAULT_CENTER);
  const [locStatus, setLocStatus] = useState("idle"); // idle | asking | ok | denied | error
  const askedRef = useRef(false);

  useReactEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    if (!("geolocation" in navigator)) {
      setLocStatus("error");
      return;
    }
    setLocStatus("asking");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocStatus("ok");
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserCenter(c);
        // Recentre si la carte existe déjà
        if (mapRef.current) {
          mapRef.current.setView(c, Math.max(mapRef.current.getZoom(), 12), { animate: true });
        }
      },
      err => {
        setLocStatus(err.code === 1 ? "denied" : "error");
        setUserCenter(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [mapRef]);

  // Retry button (optional)
  const retryGeoloc = () => {
    askedRef.current = false;
    setLocStatus("idle");
  };
  // ==== END user location handling ====

  const [showAbout, setShowAbout] = React.useState(false);

  return (
    <div className="map-section"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden"
      }}
    >

      <MapContainer
        center={userCenter}               // use dynamic center (only initial mount)
        zoom={12}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {children}
        <MapController mapRef={mapRef} />
        <InteractionListener onUserMapInteraction={onUserMapInteraction} />
        <MapZoom />

        {showClusters
          ? safeClusters.map(c => (
              <ClusterMarker
                key={`${c.lat}-${c.lon}-${c.count}`}
                cluster={c}
                onClick={onClusterClick}
              />
            ))
          : (
            <StoreMarkers
              stores={safeStores}
              onStoreSelect={onStoreSelect}
            />
          )}

        {/* SMALL STATUS BADGE (optional) */}
        {locStatus !== "ok" && locStatus !== "idle" && (
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "system-ui,sans-serif",
            display: "flex",
            gap: 8,
            alignItems: "center",
            backdropFilter: "blur(6px)"
          }}>
            <span>
              {locStatus === "asking" && "Localisation..."}
              {locStatus === "denied" && "Refusé"}
              {locStatus === "error" && "Erreur loc."}
            </span>
            {(locStatus === "denied" || locStatus === "error") && (
              <button
                onClick={retryGeoloc}
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Réessayer
              </button>
            )}
          </div>
        )}
      </MapContainer>
    </div>
  );
}

export function StoreDetailsPanel({
  selectedStore,
  onClose,
  clearSelection,
  toggleAvailability,
  expanded,
  setExpanded
}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const halfMode = !!selectedStore && !expanded && !isExiting;

  // Dimensions panel
  const panelWidth = expanded
    ? "100vw"
    : (isMobile ? "100vw" : "50vw");
  const panelHeight = "100vh";
  const panelTop = 0;
  const panelRight = 0;

  // Styles arrondis seulement en halfMode desktop
  const panelBorderRadius = expanded
    ? 0
    : (isMobile ? 0 : "24px 0 0 24px");

  return (
    <>
      {expanded && !isExiting && (
        <div
          onClick={closeWithAnimation}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1499,
            opacity,
            transition: `opacity ${fadeMs}ms ease`
          }}
        />
      )}

      { (selectedStore || isExiting) && (
        <div
          style={{
            position: "fixed",
            top: panelTop,
            right: panelRight,
            height: panelHeight,
            width: panelWidth,
            zIndex: 1500,
            display: "flex",
            flexDirection: "column",
            borderRadius: panelBorderRadius,
            boxShadow: expanded
              ? "0 0 0 0 rgba(0,0,0,0)"
              : "0 18px 48px -10px rgba(15,23,42,0.45)",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            border: expanded ? "none" : "1px solid rgba(255,255,255,0.35)",
            overflow: "hidden",
            transition: `
              width ${transitionMs}ms cubic-bezier(.4,0,.2,1),
              border-radius ${transitionMs}ms cubic-bezier(.4,0,.2,1),
              opacity ${fadeMs}ms ease,
              transform ${fadeMs}ms cubic-bezier(.4,0,.2,1)
            `,
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            pointerEvents: isExiting ? "none" : "auto"
          }}
        >
          {/* Handle */}
          <div
            onClick={() => (expanded ? collapse() : expand())}
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 56,
              height: 6,
              borderRadius: 3,
              background: "rgba(0,0,0,0.18)",
              cursor: "pointer"
            }}
            aria-label={expanded ? "Réduire" : "Déployer"}
          />

          {/* Header / actions (réutilise l’existant) */}
          {/* ...reste du contenu identique (header, tri, liste) ... */}
        </div>
      )}
    </>
  );
}