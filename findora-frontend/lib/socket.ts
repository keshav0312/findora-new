"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "./api";
import { useAuth } from "./auth-context";
import { haversineKm } from "./geo";
import type { AppNotification } from "./types";

// The backend serves both REST (/api/*) and Socket.IO on the same port —
// strip the trailing /api to get the bare origin Socket.IO connects to.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socketSingleton: Socket | null = null;

export function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socketSingleton;
}

/**
 * Joins the current user's private room on connect so the server can push
 * targeted events (new match, notification, chat message) with
 * `io.to(userId).emit(...)`. Call once near the root of the authenticated
 * app (DashboardShell does this).
 */
export function useUserSocket() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const join = () => socket.emit("user:join", user.id);
    if (socket.connected) join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
    };
  }, [user]);
}

/**
 * Live toast-style feed of incoming notifications pushed over Socket.IO
 * (in addition to the persisted list fetched from /notifications).
 */
export function useLiveNotifications() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<AppNotification | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    function onNotification(n: AppNotification) {
      if (seen.current.has(n._id)) return;
      seen.current.add(n._id);
      setLatest(n);
    }

    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, [user]);

  return latest;
}

/**
 * Tracks which userIds are currently online (i.e. have a live Socket.IO
 * connection), fed by the server's presence broadcasts. Any component can
 * call this and check `online.has(userId)` — the underlying socket
 * connection/subscription is shared, so this is cheap to call from many
 * places (chat header, matches list, dashboard, etc).
 */
export function usePresence() {
  const { user } = useAuth();
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    function onSnapshot(ids: string[]) {
      setOnline(new Set(ids));
    }
    function onUpdate({ userId, online: isOnline }: { userId: string; online: boolean }) {
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    }
    function requestSnapshot() {
      socket.emit("presence:request");
    }

    socket.on("presence:snapshot", onSnapshot);
    socket.on("presence:update", onUpdate);
    socket.on("connect", requestSnapshot);
    if (socket.connected) requestSnapshot();

    return () => {
      socket.off("presence:snapshot", onSnapshot);
      socket.off("presence:update", onUpdate);
      socket.off("connect", requestSnapshot);
    };
  }, [user]);

  return online;
}

/**
 * Read-receipt helper for a single chat conversation. Joins the conversation
 * room on the shared socket so the server's relayed `message:read` events are
 * received, tracks when the other party last read, and exposes `notifyRead`
 * to call once messages have been viewed.
 *
 * Note: the live typing indicator is handled directly on the chat page's own
 * socket (see app/chat/[matchId]/page.tsx), so it is intentionally not part of
 * this hook.
 */
export function useConversationSignals(conversationId: string | null) {
  const { user } = useAuth();
  const [readAt, setReadAt] = useState<number | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;
    const socket = getSocket();

    // The shared singleton socket must be a member of the conversation room to
    // receive the server's relayed read events. (The chat page uses a separate
    // socket for message:new, so joining there is not enough.)
    const joinRoom = () => socket.emit("conversation:join", conversationId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    function onRead(payload: { conversationId: string; userId: string }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setReadAt(Date.now());
    }

    socket.on("message:read", onRead);
    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("connect", joinRoom);
      socket.off("message:read", onRead);
    };
  }, [conversationId, user]);

  function notifyRead() {
    if (!conversationId || !user) return;
    getSocket().emit("message:read", { conversationId, userId: user.id });
  }

  return { readAt, notifyRead };
}

export interface LiveLocationPoint {
  lat: number;
  lng: number;
  at: number; // Date.now() when this fix was received
}

/**
 * Continuous GPS location sharing between the two people in a chat
 * conversation — used to show a live "how far apart are we right now" view
 * while arranging an item handover (see components/live-tracking-panel.tsx).
 *
 * Nothing here touches the database: positions are relayed peer-to-peer
 * through the server (`location:share` / `location:stop` in server.ts),
 * the same pattern as typing indicators and WebRTC call signaling. Turning
 * sharing off (or leaving the page) immediately stops broadcasting your
 * position — the other party just stops receiving updates.
 */
export function useLiveLocationTracking(conversationId: string | null, enabled: boolean) {
  const { user } = useAuth();
  const [myLocation, setMyLocation] = useState<LiveLocationPoint | null>(null);
  const [peerLocation, setPeerLocation] = useState<LiveLocationPoint | null>(null);
  const [peerSharing, setPeerSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  // Listen for the other party's position, regardless of whether *we're*
  // currently sharing ours — they might turn theirs on first.
  useEffect(() => {
    if (!conversationId || !user) return;
    const socket = getSocket();

    function onShare(payload: { conversationId: string; userId: string; lat: number; lng: number }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setPeerLocation({ lat: payload.lat, lng: payload.lng, at: Date.now() });
      setPeerSharing(true);
    }
    function onStop(payload: { conversationId: string; userId: string }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setPeerSharing(false);
      setPeerLocation(null);
    }

    socket.on("location:share", onShare);
    socket.on("location:stop", onStop);
    return () => {
      socket.off("location:share", onShare);
      socket.off("location:stop", onStop);
    };
  }, [conversationId, user]);

  // Watch + broadcast our own position while `enabled` is true.
  useEffect(() => {
    if (!enabled || !conversationId || !user) {
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Location isn't supported on this device.");
      return;
    }

    const socket = getSocket();
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() };
        setMyLocation(point);
        socket.emit("location:share", { conversationId, userId: user.id, lat: point.lat, lng: point.lng });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — allow it in your browser to share live location."
            : "Couldn't get your location right now."
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      socket.emit("location:stop", { conversationId, userId: user.id });
      setMyLocation(null);
    };
  }, [enabled, conversationId, user]);

  const distanceKm =
    myLocation && peerLocation
      ? haversineKm(myLocation.lat, myLocation.lng, peerLocation.lat, peerLocation.lng)
      : null;

  return { myLocation, peerLocation, peerSharing, distanceKm, error };
}

export interface AdminActivityEvent {
  id: string;
  kind: "report" | "match" | "returned";
  message: string;
  city?: string;
  at: string;
}

/**
 * Live feed of platform-wide activity (new reports, AI matches, items
 * returned) for the admin/police dashboards. Joins the shared "admins"
 * broadcast room so the server's `io.to("admins").emit("admin:activity", …)`
 * calls (see itemFactory.ts / match.controller.ts) reach this client.
 */
export function useAdminLiveFeed(maxItems = 25) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdminActivityEvent[]>([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "police")) return;
    const socket = getSocket();

    const joinRoom = () => socket.emit("room:join", "admins");
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    function onActivity(evt: AdminActivityEvent) {
      setEvents((prev) => [evt, ...prev].slice(0, maxItems));
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }
    socket.on("admin:activity", onActivity);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("admin:activity", onActivity);
    };
  }, [user, maxItems]);

  return { events, pulse };
}