"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "./api";
import { useAuth } from "./auth-context";
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
 * Typing indicator + read-receipt helper for a single chat conversation.
 * Emits `typing` while the user types (throttled + auto-expiring), listens
 * for the other party's typing/read events, and exposes a `notifyRead`
 * function to call once messages have been viewed.
 */
export function useConversationSignals(conversationId: string | null) {
  const { user } = useAuth();
  const [typingUser, setTypingUser] = useState<{ userId: string; name?: string } | null>(null);
  const [readAt, setReadAt] = useState<number | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmit = useRef(0);

  useEffect(() => {
    if (!conversationId || !user) return;
    const socket = getSocket();

    function onTyping(payload: { conversationId: string; userId: string; name?: string }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setTypingUser({ userId: payload.userId, name: payload.name });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 3000);
    }
    function onTypingStop(payload: { conversationId: string; userId: string }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setTypingUser(null);
    }
    function onRead(payload: { conversationId: string; userId: string }) {
      if (payload.conversationId !== conversationId || payload.userId === user!.id) return;
      setReadAt(Date.now());
    }

    socket.on("typing", onTyping);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:read", onRead);
    return () => {
      socket.off("typing", onTyping);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:read", onRead);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [conversationId, user]);

  function notifyTyping() {
    if (!conversationId || !user) return;
    const now = Date.now();
    if (now - lastEmit.current < 1500) return; // throttle
    lastEmit.current = now;
    getSocket().emit("typing", { conversationId, userId: user.id, name: user.name });
  }

  function notifyStoppedTyping() {
    if (!conversationId || !user) return;
    getSocket().emit("typing:stop", { conversationId, userId: user.id });
  }

  function notifyRead() {
    if (!conversationId || !user) return;
    getSocket().emit("message:read", { conversationId, userId: user.id });
  }

  return { typingUser, readAt, notifyTyping, notifyStoppedTyping, notifyRead };
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
