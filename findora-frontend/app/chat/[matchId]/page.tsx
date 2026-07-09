"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Mic,
  Square,
  Phone,
  Video,
  Play,
  Pause,
  Check,
  CheckCheck,
  MapPin,
  Radar,
  X,
} from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Avatar } from "@/components/ui-bits";
import { CallModal } from "@/components/call-modal";
import { LiveTrackingPanel } from "@/components/live-tracking-panel";
import { LiveMap, MapPin as MapPinType } from "@/components/live-map";
import { api } from "@/lib/api";
import { getToken, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePresence, useConversationSignals } from "@/lib/socket";
import { useCall } from "@/lib/webrtc";
import { useToast } from "@/lib/toast-context";
import { ChatMessage, MatchRecord } from "@/lib/types";
import { timeAgo } from "@/lib/format";

function VoiceBubble({ url, mine }: { url: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const origin = API_URL.replace(/\/api\/?$/, "");
  const src = url.startsWith("http") ? url : `${origin}${url}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!audioRef.current) return;
          if (playing) audioRef.current.pause();
          else audioRef.current.play();
        }}
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          mine ? "bg-white/20" : "bg-brand-indigo/10 text-brand-indigo"
        }`}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <div className={`h-1.5 flex-1 min-w-24 rounded-full ${mine ? "bg-white/25" : "bg-slate-300"}`} />
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

function LocationBubble({
  location,
  mine,
}: {
  location: { lat: number; lng: number; label?: string };
  mine: boolean;
}) {
  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  return (
    <div className="mb-1 w-56 max-w-full">
      <div className="overflow-hidden rounded-lg">
        <LiveMap
          className="h-32 w-full"
          zoom={15}
          pins={[
            {
              id: "shared-location",
              lat: location.lat,
              lng: location.lng,
              label: location.label || "Shared location",
            },
          ]}
        />
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-1.5 flex items-center gap-1 text-xs font-medium underline ${
          mine ? "text-white" : "text-brand-indigo"
        }`}
      >
        <MapPin className="size-3.5" />
        {location.label || "Open live location in Maps"}
      </a>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showTrackingMap, setShowTrackingMap] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [sharingMyLocation, setSharingMyLocation] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunks = useRef<Blob[]>([]);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef(0);
  const otherIdRef = useRef<string | null>(null);
  const conversationId = `match_${params.matchId}`;

  const online = usePresence();
  const { notifyRead } = useConversationSignals(conversationId);

  const otherParty =
    match && user
      ? String(match.lostOwner._id) === user.id
        ? match.foundOwner
        : match.lostOwner
      : null;

  const call = useCall(conversationId, otherParty?._id, otherParty?.name);

  useEffect(() => {
    otherIdRef.current = otherParty?._id ?? null;
  }, [otherParty]);

  useEffect(() => {
    api.get<{ data: MatchRecord[] }>("/matches").then((r) => {
      const found = r.data.find((m) => m._id === params.matchId);
      if (found) setMatch(found);
    });
    api.get<{ data: ChatMessage[] }>(`/messages/${params.matchId}`).then((r) => setMessages(r.data));
  }, [params.matchId]);

  useEffect(() => {
    const socketUrl = API_URL.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.emit("conversation:join", conversationId);
    socket.on("message:new", (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      setPeerTyping(false);
    });
    socket.on("typing", ({ userId }: { userId: string }) => {
      if (!userId || userId !== otherIdRef.current) return;
      setPeerTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setPeerTyping(false), 3000);
    });
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      socket.emit("conversation:leave", conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // Mark the thread read once messages are loaded/visible.
  useEffect(() => {
    if (messages.length === 0 || !params.matchId) return;
    const hasUnread = messages.some((m) => m.recipient === user?.id && !m.read);
    if (hasUnread) {
      api.post(`/messages/${params.matchId}/read`, {}).catch(() => {});
      notifyRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, params.matchId]);

  const isOnline = otherParty ? online.has(otherParty._id) : false;

  const emitTyping = (value: string) => {
    if (!value.trim() || !user) return;
    const now = Date.now();
    if (now - lastTypingEmit.current < 1000) return; // throttle
    lastTypingEmit.current = now;
    socketRef.current?.emit("typing", { conversationId, userId: user.id, name: user.name });
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !otherParty || !user || sending) return;
    const body = { matchId: params.matchId, recipient: otherParty._id, text };
    setText("");
    setSending(true);
    try {
      const res = await api.post<{ data: ChatMessage }>("/messages", body);
      setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
    } catch {
      // no-op — real app would show a retry affordance
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File, kind: "image" | "audio", durationSeconds?: number) => {
    if (!otherParty) return;
    const form = new FormData();
    form.append("file", file);
    form.append("matchId", String(params.matchId));
    form.append("recipient", otherParty._id);
    form.append("kind", kind);
    if (durationSeconds) form.append("durationSeconds", String(durationSeconds));
    try {
      const res = await api.post<{ data: ChatMessage }>("/messages/upload", form);
      setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
    } catch {
      // no-op
    }
  };

  const shareLiveLocation = () => {
    if (!otherParty || !user || sharingLocation) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast({ kind: "error", title: "Location sharing isn't supported on this device." });
      return;
    }
    setSharingLocation(true);

    const onSuccess = async (pos: GeolocationPosition) => {
      try {
        const res = await api.post<{ data: ChatMessage }>("/messages/location", {
          matchId: params.matchId,
          recipient: otherParty._id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
        toast({ kind: "success", title: "Location sent" });
      } catch (err) {
        toast({
          kind: "error",
          title: "Couldn't send your location",
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setSharingLocation(false);
      }
    };

    const onError = (err: GeolocationPositionError) => {
      setSharingLocation(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast({
          kind: "error",
          title: "Location access denied",
          description: "Allow location access for this site in your browser settings and try again.",
        });
      } else if (err.code === err.TIMEOUT) {
        toast({
          kind: "error",
          title: "Location request timed out",
          description: "Make sure location services are on for your device/browser, then try again.",
        });
      } else {
        toast({ kind: "error", title: "Couldn't get your location", description: err.message });
      }
    };

    // A generous timeout + maximumAge: desktop browsers resolve location via
    // network/Wi-Fi lookup, which can take longer than mobile GPS.
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000,
    });
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunks.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunks.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        uploadFile(file, "audio", recordSeconds);
        setRecordSeconds(0);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      recordTimer.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      // mic permission denied or unavailable — no-op
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordTimer.current) clearInterval(recordTimer.current);
    recordTimer.current = null;
  };

  const trackingPins: MapPinType[] = [];
  if (match?.lostItem?.coordinates?.lat && match.lostItem.coordinates.lng) {
    trackingPins.push({
      id: "lost",
      lat: match.lostItem.coordinates.lat,
      lng: match.lostItem.coordinates.lng,
      label: `Lost: ${match.lostItem.title}`,
      sublabel: match.lostItem.location,
      kind: "lost",
    });
  }
  if (match?.foundItem?.coordinates?.lat && match.foundItem.coordinates.lng) {
    trackingPins.push({
      id: "found",
      lat: match.foundItem.coordinates.lat,
      lng: match.foundItem.coordinates.lng,
      label: `Found: ${match.foundItem.title}`,
      sublabel: match.foundItem.location,
      kind: "found",
    });
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <Link href="/matches" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="relative">
            <Avatar name={otherParty?.name} src={otherParty?.avatar} size={9} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white dark:border-slate-900 ${
                isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
              Chat with {otherParty?.name || "Findora user"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {peerTyping ? (
                <span className="font-medium text-brand-indigo">typing…</span>
              ) : isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400">Online</span>
              ) : otherParty?.lastSeen ? (
                `Last seen ${timeAgo(otherParty.lastSeen)}`
              ) : (
                `Regarding ${match?.lostItem?.title || "this report"}`
              )}
            </p>
          </div>
          {trackingPins.length > 0 && (
            <button
              onClick={() => setShowTrackingMap((s) => !s)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Reported lost/found locations"
            >
              <MapPin className="size-4" />
            </button>
          )}
          <button
            onClick={() => setShowLiveTracking((s) => !s)}
            disabled={!otherParty}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-40 ${
              showLiveTracking
                ? "border-brand-indigo bg-brand-indigo text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
            title="Live location tracking"
          >
            <Radar className="size-4" />
          </button>
          <button
            onClick={() => call.startCall("audio")}
            disabled={!otherParty || call.state !== "idle"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Voice call"
          >
            <Phone className="size-4" />
          </button>
          <button
            onClick={() => call.startCall("video")}
            disabled={!otherParty || call.state !== "idle"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Video call"
          >
            <Video className="size-4" />
          </button>
        </div>

        {showLiveTracking && (
          <LiveTrackingPanel
            conversationId={conversationId}
            enabled={sharingMyLocation}
            onToggle={setSharingMyLocation}
            onClose={() => {
              setShowLiveTracking(false);
              setSharingMyLocation(false);
            }}
            myName={user?.name}
            peerName={otherParty?.name}
          />
        )}

        {showTrackingMap && trackingPins.length > 0 && (
          <div className="relative border-b border-slate-100 dark:border-slate-800">
            <LiveMap pins={trackingPins} showRoute className="h-48 w-full" />
            <button
              onClick={() => setShowTrackingMap(false)}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow dark:bg-slate-900/90"
            >
              <X className="size-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 flex gap-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-slate-600 shadow dark:bg-slate-900/90 dark:text-slate-300">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Lost here</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Found here</span>
            </div>
          </div>
        )}

        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, idx) => {
            const mine = m.sender === user?.id;
            const isLastMine = mine && idx === messages.length - 1;
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-indigo text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.attachment?.kind === "image" && (
                    <img
                      src={
                        m.attachment.url.startsWith("http")
                          ? m.attachment.url
                          : `${API_URL.replace(/\/api\/?$/, "")}${m.attachment.url}`
                      }
                      alt="Shared photo"
                      className="mb-1 max-h-56 w-full rounded-lg object-cover"
                    />
                  )}
                  {m.attachment?.kind === "audio" && <VoiceBubble url={m.attachment.url} mine={mine} />}
                  {m.location && <LocationBubble location={m.location} mine={mine} />}
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                    <span>{timeAgo(m.createdAt)}</span>
                    {isLastMine && (m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              Say hello and share a detail only the real owner would know.
            </p>
          )}
          {peerTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-brand-indigo dark:hover:bg-slate-800"
            title="Send a photo"
          >
            <ImageIcon className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={shareLiveLocation}
            disabled={sharingLocation || !otherParty}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-brand-indigo disabled:opacity-50 dark:hover:bg-slate-800"
            title="Share your live location"
          >
            {sharingLocation ? (
              <span className="size-4 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
            ) : (
              <MapPin className="size-4.5" />
            )}
          </button>

          {recording ? (
            <div className="flex flex-1 items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-600 dark:bg-rose-500/10">
              <span className="size-2 animate-pulse rounded-full bg-rose-500" />
              Recording… {recordSeconds}s
            </div>
          ) : (
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping(e.target.value);
              }}
              placeholder="Type a message..."
              className="input-plain flex-1"
            />
          )}

          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={() => recording && stopRecording()}
            onMouseLeave={() => recording && stopRecording()}
            onTouchStart={startRecording}
            onTouchEnd={() => recording && stopRecording()}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
              recording ? "bg-rose-500 text-white" : "text-slate-400 hover:bg-slate-50 hover:text-brand-indigo dark:hover:bg-slate-800"
            }`}
            title="Hold to record a voice note"
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-4.5" />}
          </button>

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-indigo text-white transition hover:bg-brand-indigo-dark disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>

      <CallModal call={call} peerName={otherParty?.name} peerAvatar={otherParty?.avatar} />
    </DashboardShell>
  );
}