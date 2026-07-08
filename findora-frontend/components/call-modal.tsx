"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from "lucide-react";
import { Avatar } from "./ui-bits";
import type { useCall } from "@/lib/webrtc";

function useVideoBinding(stream: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return ref;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface CallModalProps {
  call: ReturnType<typeof useCall>;
  peerName?: string;
  peerAvatar?: string | null;
}

/**
 * Renders nothing while `call.state === "idle"`. Otherwise shows either the
 * incoming-call ring screen or the live audio/video call UI, wired to the
 * `useCall` WebRTC hook.
 */
export function CallModal({ call, peerName, peerAvatar }: CallModalProps) {
  const localVideoRef = useVideoBinding(call.localStream);
  const remoteVideoRef = useVideoBinding(call.remoteStream);

  if (call.state === "idle") return null;

  if (call.state === "incoming") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-slate-950/95 text-white backdrop-blur">
        <p className="text-sm text-slate-400">
          Incoming {call.incoming?.callType === "video" ? "video" : "voice"} call
        </p>
        <Avatar name={call.incoming?.fromName || peerName} src={call.incoming?.fromAvatar || peerAvatar} size={20} />
        <p className="font-heading text-xl font-semibold">{call.incoming?.fromName || peerName || "Findora user"}</p>
        <div className="mt-4 flex items-center gap-8">
          <button
            onClick={call.rejectCall}
            className="flex size-16 items-center justify-center rounded-full bg-rose-600 shadow-lg shadow-rose-600/30 transition hover:scale-105"
            aria-label="Decline"
          >
            <PhoneOff className="size-6" />
          </button>
          <button
            onClick={call.acceptCall}
            className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition hover:scale-105"
            aria-label="Accept"
          >
            <Phone className="size-6" />
          </button>
        </div>
      </div>
    );
  }

  const connecting = call.state === "outgoing";
  const isVideo = call.callType === "video";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white">
      <div className="relative flex-1 overflow-hidden">
        {isVideo && call.remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Avatar name={peerName} src={peerAvatar} size={20} />
            <p className="font-heading text-xl font-semibold">{peerName || "Findora user"}</p>
            <p className="text-sm text-slate-400">
              {connecting ? "Calling…" : call.state === "connected" ? formatDuration(call.durationSec) : ""}
            </p>
          </div>
        )}

        {isVideo && call.localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-4 h-36 w-24 rounded-xl border-2 border-white/20 object-cover shadow-lg sm:h-44 sm:w-32"
          />
        )}

        {isVideo && call.state === "connected" && (
          <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium">
            {formatDuration(call.durationSec)}
          </div>
        )}

        {call.error && (
          <div className="absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-rose-600/90 px-4 py-1.5 text-xs font-medium">
            {call.error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-white/10 bg-slate-950/90 py-6">
        <button
          onClick={call.toggleMute}
          className="flex size-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label="Toggle mute"
        >
          {call.muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        {isVideo && (
          <button
            onClick={call.toggleCamera}
            className="flex size-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Toggle camera"
          >
            {call.cameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>
        )}

        <button
          onClick={call.endCall}
          className="flex size-16 items-center justify-center rounded-full bg-rose-600 shadow-lg shadow-rose-600/30 transition hover:scale-105"
          aria-label="End call"
        >
          <PhoneOff className="size-6" />
        </button>
      </div>
    </div>
  );
}
