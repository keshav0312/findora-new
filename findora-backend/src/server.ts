import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
  },
});

// ---------------------------------------------------------------------------
// Presence tracking (who's online right now)
// ---------------------------------------------------------------------------
// A user can have multiple tabs/devices open at once, so we keep a
// reference count per userId rather than a plain boolean. When the count
// drops to zero we wait a short grace period (in case it's just a page
// refresh / reconnect) before broadcasting "offline" and stamping lastSeen.
const onlineCounts = new Map<string, number>();
const offlineTimers = new Map<string, NodeJS.Timeout>();
const OFFLINE_GRACE_MS = 8000;

function broadcastPresence(userId: string, online: boolean) {
  io.emit("presence:update", { userId, online, at: new Date().toISOString() });
}

function markOnline(userId: string) {
  const existingTimer = offlineTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    offlineTimers.delete(userId);
  }
  const count = onlineCounts.get(userId) || 0;
  onlineCounts.set(userId, count + 1);
  if (count === 0) broadcastPresence(userId, true);
}

function markOffline(userId: string) {
  const count = onlineCounts.get(userId) || 0;
  const next = Math.max(0, count - 1);
  if (next === 0) {
    onlineCounts.delete(userId);
    const timer = setTimeout(async () => {
      offlineTimers.delete(userId);
      if (!onlineCounts.has(userId)) {
        broadcastPresence(userId, false);
        try {
          const User = (await import("./models/User.js")).default;
          await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
        } catch {
          /* non-fatal */
        }
      }
    }, OFFLINE_GRACE_MS);
    offlineTimers.set(userId, timer);
  } else {
    onlineCounts.set(userId, next);
  }
}

io.on("connection", (socket) => {
  let joinedUserId: string | null = null;

  // Client emits this right after connecting (see lib/socket.ts on the
  // frontend) so the server can push targeted events (new match, notification, chat message) with
  // `io.to(userId).emit(...)`. It also enrolls the socket in presence tracking.
  socket.on("user:join", (userId: string) => {
    if (!userId) return;
    socket.join(userId);
    joinedUserId = userId;
    markOnline(userId);
    // Tell this socket who's currently online so its UI can render presence
    // without waiting for the next broadcast.
    socket.emit("presence:snapshot", Array.from(onlineCounts.keys()));
  });

  // A client can ask for a fresh snapshot at any time (e.g. on opening a
  // chat thread) instead of waiting for a broadcast.
  socket.on("presence:request", () => {
    socket.emit("presence:snapshot", Array.from(onlineCounts.keys()));
  });

  // Generic broadcast-room join, used by the admin/police dashboards to
  // subscribe to the platform-wide live activity feed ("admins" room).
  socket.on("room:join", (room: string) => {
    if (room) socket.join(room);
  });

  socket.on("conversation:join", (conversationId: string) => {
    socket.join(conversationId);
  });

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(conversationId);
  });

  // "typing" is forwarded to everyone else in the conversation room; the
  // client is expected to auto-expire it a few seconds after the last event
  // (see lib/socket.ts / chat page) rather than us tracking a timer here.
  socket.on(
    "typing",
    ({ conversationId, userId, name }: { conversationId: string; userId: string; name?: string }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("typing", { userId, name, conversationId });
    }
  );

  socket.on("typing:stop", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("typing:stop", { userId, conversationId });
  });

  // Read receipts: sender marks the thread read on their end, we relay it
  // to the room so the other party's ticks update instantly.
  socket.on(
    "message:read",
    ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("message:read", { conversationId, userId });
    }
  );

  // ---------------------------------------------------------------------
  // 1:1 audio/video calling (WebRTC signaling relay only — the actual
  // media stream flows peer-to-peer once both sides exchange SDP/ICE).
  // Every event just gets forwarded to the target user's private room, the
  // same room they joined via `user:join`.
  // ---------------------------------------------------------------------
  socket.on(
    "call:invite",
    (payload: { to: string; from: string; fromName?: string; fromAvatar?: string | null; conversationId: string; callType: "audio" | "video" }) => {
      if (!payload?.to) return;
      io.to(payload.to).emit("call:invite", payload);
    }
  );

  socket.on("call:accept", (payload: { to: string; from: string; conversationId: string }) => {
    if (!payload?.to) return;
    io.to(payload.to).emit("call:accept", payload);
  });

  socket.on("call:reject", (payload: { to: string; from: string; conversationId: string; reason?: string }) => {
    if (!payload?.to) return;
    io.to(payload.to).emit("call:reject", payload);
  });

  socket.on("call:end", (payload: { to: string; from: string; conversationId: string }) => {
    if (!payload?.to) return;
    io.to(payload.to).emit("call:end", payload);
  });

  // SDP offers/answers and ICE candidates all travel through this one
  // generic envelope so the client only needs one listener.
  socket.on("call:signal", (payload: { to: string; from: string; data: unknown }) => {
    if (!payload?.to) return;
    io.to(payload.to).emit("call:signal", payload);
  });

  socket.on("disconnect", () => {
    if (joinedUserId) markOffline(joinedUserId);
  });
});

// Make the io instance reachable from controllers via req.app.get("io").
app.set("io", io);

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
