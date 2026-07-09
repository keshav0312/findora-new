"use client";

import { Radar, Navigation2, X, AlertCircle } from "lucide-react";
import { LiveMap, MapPin } from "./live-map";
import { useLiveLocationTracking } from "@/lib/socket";
import { formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface LiveTrackingPanelProps {
  conversationId: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  onClose: () => void;
  myName?: string;
  peerName?: string;
}

/**
 * "Where are we both right now" panel for a chat thread — shows a live map
 * with both parties' current GPS position and the distance between them,
 * updating continuously while sharing is on. Useful for coordinating an
 * in-person handover of a lost/found item.
 */
export function LiveTrackingPanel({
  conversationId,
  enabled,
  onToggle,
  onClose,
  myName = "You",
  peerName = "The other person",
}: LiveTrackingPanelProps) {
  const { myLocation, peerLocation, peerSharing, distanceKm, error } = useLiveLocationTracking(
    conversationId,
    enabled
  );

  const pins: MapPin[] = [];
  if (myLocation) {
    pins.push({ id: "me", lat: myLocation.lat, lng: myLocation.lng, label: myName, kind: "found" });
  }
  if (peerLocation) {
    pins.push({ id: "peer", lat: peerLocation.lat, lng: peerLocation.lng, label: peerName, kind: "lost" });
  }

  return (
    <div className="relative border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <span className={cn("flex size-7 items-center justify-center rounded-full", enabled ? "bg-emerald-50 text-brand-green dark:bg-emerald-500/10" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}>
            <Radar className={cn("size-3.5", enabled && "animate-pulse")} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Live location tracking</p>
            {distanceKm !== null ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-brand-indigo">
                <Navigation2 className="size-3" /> {formatDistance(distanceKm)} apart
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                {enabled
                  ? peerSharing
                    ? "Getting your position…"
                    : `Waiting for ${peerName} to turn theirs on too…`
                  : "Turn on to share your live position"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!enabled)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
              enabled
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10"
                : "bg-brand-indigo text-white hover:bg-brand-indigo-dark"
            )}
          >
            {enabled ? "Stop sharing" : "Share my location"}
          </button>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </div>
      )}

      <LiveMap pins={pins} showRoute={pins.length === 2} className="h-52 w-full" />

      <div className="absolute bottom-2 left-2 flex gap-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-slate-600 shadow dark:bg-slate-900/90 dark:text-slate-300">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> {myName}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-red-500" /> {peerName}
        </span>
      </div>
    </div>
  );
}
