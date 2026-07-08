"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPreview } from "./map-preview";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  kind?: "lost" | "found";
}

const DEFAULT_CENTER = { lat: 23.2599, lng: 77.4126 }; // Bhopal, MP — sensible default

interface LiveMapProps {
  className?: string;
  pins?: MapPin[];
  center?: { lat: number; lng: number };
  zoom?: number;
  /** Enables click-to-pick-location mode (used by the report form). */
  pickable?: boolean;
  onPick?: (coords: { lat: number; lng: number }) => void;
  pickedLocation?: { lat: number; lng: number } | null;
  /** Draws a dashed line connecting the first two pins (lost ↔ found tracking). */
  showRoute?: boolean;
}

/**
 * Live map used across the app: nearby-reports widget on the dashboard,
 * item detail location, search results, match tracking, and the
 * click-to-drop-a-pin location picker in the report form.
 *
 * Renders real OpenStreetMap tiles via Leaflet — no API key required, so
 * every deployment shows actual pin locations out of the box. If
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, Google's tiles/markers are used
 * instead (nicer styling, same pin data).
 */
export function LiveMap(props: LiveMapProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  if (googleKey) return <GoogleLiveMap {...props} apiKey={googleKey} />;
  return <LeafletLiveMap {...props} />;
}

// ---------------------------------------------------------------------------
// Leaflet / OpenStreetMap engine (default — zero configuration required)
// ---------------------------------------------------------------------------
function LeafletLiveMap({
  className,
  pins = [],
  center,
  zoom = 12,
  pickable = false,
  onPick,
  pickedLocation,
  showRoute = false,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const mapCenter = center || (pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : DEFAULT_CENTER);

  // Load Leaflet's JS + CSS on the client only (it touches `window` at
  // import time), then build the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([mapCenter.lat, mapCenter.lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      if (pickable && onPick) {
        map.on("click", (e: any) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Only build the map once; pins/markers are synced in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync markers/route whenever pins change, without rebuilding the map.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      const layer = layerRef.current;
      layer.clearLayers();

      const colorFor = (kind?: string) => (kind === "found" ? "#16a34a" : kind === "lost" ? "#dc2626" : "#4338ca");

      const dot = (color: string) =>
        L.divIcon({
          className: "",
          html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

      pins.forEach((pin) => {
        const marker = L.marker([pin.lat, pin.lng], { icon: dot(colorFor(pin.kind)) }).addTo(layer);
        marker.bindPopup(
          `<div style="font-size:12px"><strong>${escapeHtml(pin.label)}</strong>${
            pin.sublabel ? `<br/><span style="color:#64748b">${escapeHtml(pin.sublabel)}</span>` : ""
          }</div>`
        );
      });

      if (pickedLocation) {
        L.marker([pickedLocation.lat, pickedLocation.lng], { icon: dot("#4338ca") }).addTo(layer);
      }

      if (showRoute && pins.length >= 2) {
        L.polyline(
          [
            [pins[0].lat, pins[0].lng],
            [pins[1].lat, pins[1].lng],
          ],
          { color: "#6366f1", weight: 3, dashArray: "6 8", opacity: 0.8 }
        ).addTo(layer);
      }

      const allPoints = [...pins.map((p) => [p.lat, p.lng] as [number, number])];
      if (pickedLocation) allPoints.push([pickedLocation.lat, pickedLocation.lng]);
      if (allPoints.length > 1) {
        map.fitBounds(allPoints, { padding: [32, 32], maxZoom: 15 });
      } else if (allPoints.length === 1) {
        map.setView(allPoints[0], zoom);
      }
    })();
  }, [ready, pins, pickedLocation, showRoute, zoom]);

  // Recenter if `center` changes externally (e.g. search result selected).
  useEffect(() => {
    if (ready && mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [ready, center, zoom]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <div ref={containerRef} className="h-full w-full" />
      {pickable && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
          Tap the map to drop a pin at the exact spot
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ---------------------------------------------------------------------------
// Google Maps engine (opt-in — used only when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// is configured, for teams that want Google's styling/imagery).
// ---------------------------------------------------------------------------
function GoogleLiveMap({
  className,
  pins = [],
  center,
  zoom = 12,
  pickable = false,
  onPick,
  pickedLocation,
  apiKey,
}: LiveMapProps & { apiKey: string }) {
  const [Comp, setComp] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    import("@react-google-maps/api").then((mod) => {
      if (!cancelled) setComp(() => mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mapCenter = useMemo(
    () => center || (pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : DEFAULT_CENTER),
    [center, pins]
  );

  const [activePin, setActivePin] = useState<string | null>(null);

  if (!Comp) {
    return (
      <div className={cn("relative", className)}>
        <MapPreview className="h-full w-full" dense={pins.length > 3} />
      </div>
    );
  }

  const { GoogleMap, LoadScript, Marker, InfoWindow } = Comp;

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={zoom}
          onClick={(e: any) => {
            if (!pickable || !onPick || !e.latLng) return;
            onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
          }}
        >
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              onClick={() => setActivePin(pin.id)}
              icon={{
                path: (window as any).google?.maps?.SymbolPath?.CIRCLE,
                scale: 8,
                fillColor: pin.kind === "found" ? "#16a34a" : "#dc2626",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          ))}
          {pins
            .filter((p) => p.id === activePin)
            .map((pin) => (
              <InfoWindow key={pin.id} position={{ lat: pin.lat, lng: pin.lng }} onCloseClick={() => setActivePin(null)}>
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">{pin.label}</p>
                  {pin.sublabel && <p className="text-slate-500">{pin.sublabel}</p>}
                </div>
              </InfoWindow>
            ))}
          {pickedLocation && (
            <Marker
              position={pickedLocation}
              icon={{
                path: (window as any).google?.maps?.SymbolPath?.CIRCLE,
                scale: 9,
                fillColor: "#4338ca",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
