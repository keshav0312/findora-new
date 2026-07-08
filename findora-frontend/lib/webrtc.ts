"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "./socket";
import { useAuth } from "./auth-context";

export type CallType = "audio" | "video";
export type CallState = "idle" | "outgoing" | "incoming" | "connected";

interface IncomingCall {
  from: string;
  fromName?: string;
  fromAvatar?: string | null;
  conversationId: string;
  callType: CallType;
}

type SignalData =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * One-to-one audio/video calling for a chat thread. Signaling (who's
 * calling whom, SDP offers/answers, ICE candidates) is relayed through the
 * existing Socket.IO connection — see the `call:*` handlers in
 * findora-backend/src/server.ts. Media itself flows directly between the
 * two browsers (peer-to-peer) once the handshake completes.
 */
export function useCall(conversationId: string, otherPartyId?: string, otherPartyName?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteDescSet = useRef(false);
  const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const signalQueue = useRef<{ from: string; data: SignalData }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    remoteDescSet.current = false;
    candidateQueue.current = [];
    signalQueue.current = [];
    setLocalStream((s) => {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setRemoteStream(null);
    setIncoming(null);
    setState("idle");
    setMuted(false);
    setCameraOff(false);
    setDurationSec(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const createPeerConnection = useCallback(
    (targetId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          getSocket().emit("call:signal", {
            to: targetId,
            from: user!.id,
            data: { type: "ice", candidate: e.candidate.toJSON() },
          });
        }
      };
      pc.ontrack = (e) => {
        setRemoteStream((prev) => {
          const stream = prev || new MediaStream();
          if (!stream.getTracks().some((t) => t.id === e.track.id)) stream.addTrack(e.track);
          return stream;
        });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setState("connected");
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
          }
        }
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          // Let an explicit call:end drive cleanup instead of transient blips.
        }
      };
      pcRef.current = pc;
      return pc;
    },
    [user]
  );

  const processSignal = useCallback(async (from: string, data: SignalData) => {
    const pc = pcRef.current;
    if (!pc) {
      signalQueue.current.push({ from, data });
      return;
    }
    if (data.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      remoteDescSet.current = true;
      for (const c of candidateQueue.current) await pc.addIceCandidate(c);
      candidateQueue.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket().emit("call:signal", { to: from, from: user!.id, data: { type: "answer", sdp: answer } });
    } else if (data.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      remoteDescSet.current = true;
      for (const c of candidateQueue.current) await pc.addIceCandidate(c);
      candidateQueue.current = [];
    } else if (data.type === "ice") {
      if (remoteDescSet.current) await pc.addIceCandidate(data.candidate);
      else candidateQueue.current.push(data.candidate);
    }
  }, [user]);

  const drainQueue = useCallback(
    (from: string) => {
      const items = signalQueue.current.filter((i) => i.from === from);
      signalQueue.current = signalQueue.current.filter((i) => i.from !== from);
      items.forEach((i) => processSignal(i.from, i.data));
    },
    [processSignal]
  );

  const getMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { width: 480, height: 360 } : false,
    });
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(
    async (type: CallType) => {
      if (!user || !otherPartyId) return;
      try {
        setError(null);
        setCallType(type);
        setState("outgoing");
        const stream = await getMedia(type);
        const pc = createPeerConnection(otherPartyId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit("call:invite", {
          to: otherPartyId,
          from: user.id,
          fromName: user.name,
          fromAvatar: user.avatar,
          conversationId,
          callType: type,
        });
        getSocket().emit("call:signal", { to: otherPartyId, from: user.id, data: { type: "offer", sdp: offer } });
      } catch (err) {
        setError((err as Error).message || "Couldn't access camera/microphone");
        cleanup();
      }
    },
    [user, otherPartyId, conversationId, getMedia, createPeerConnection, cleanup]
  );

  const acceptCall = useCallback(async () => {
    if (!incoming || !user) return;
    try {
      setError(null);
      const type = incoming.callType;
      setCallType(type);
      const stream = await getMedia(type);
      const pc = createPeerConnection(incoming.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      getSocket().emit("call:accept", { to: incoming.from, from: user.id, conversationId });
      drainQueue(incoming.from);
      setState("connected");
    } catch (err) {
      setError((err as Error).message || "Couldn't access camera/microphone");
      if (incoming) getSocket().emit("call:reject", { to: incoming.from, from: user.id, conversationId, reason: "device_error" });
      cleanup();
    }
  }, [incoming, user, conversationId, getMedia, createPeerConnection, drainQueue, cleanup]);

  const rejectCall = useCallback(() => {
    if (incoming && user) {
      getSocket().emit("call:reject", { to: incoming.from, from: user.id, conversationId });
    }
    cleanup();
  }, [incoming, user, conversationId, cleanup]);

  const endCall = useCallback(() => {
    if (user && otherPartyId) {
      getSocket().emit("call:end", { to: otherPartyId, from: user.id, conversationId });
    }
    cleanup();
  }, [user, otherPartyId, conversationId, cleanup]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      localStream?.getAudioTracks().forEach((t) => (t.enabled = m));
      return !m;
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setCameraOff((c) => {
      localStream?.getVideoTracks().forEach((t) => (t.enabled = c));
      return !c;
    });
  }, [localStream]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    function onInvite(payload: IncomingCall & { to: string }) {
      if (payload.conversationId !== conversationId) return;
      if (stateRef.current !== "idle") {
        // Busy on another call — auto-decline.
        socket.emit("call:reject", { to: payload.from, from: user!.id, conversationId, reason: "busy" });
        return;
      }
      setIncoming(payload);
      setCallType(payload.callType);
      setState("incoming");
    }
    function onAccept(payload: { from: string; conversationId: string }) {
      if (payload.conversationId !== conversationId) return;
      setState("connected");
    }
    function onReject(payload: { from: string; conversationId: string }) {
      if (payload.conversationId !== conversationId) return;
      setError("Call declined");
      cleanup();
    }
    function onEnd(payload: { from: string; conversationId: string }) {
      if (payload.conversationId !== conversationId) return;
      cleanup();
    }
    function onSignal(payload: { from: string; to: string; data: SignalData }) {
      processSignal(payload.from, payload.data);
    }

    socket.on("call:invite", onInvite);
    socket.on("call:accept", onAccept);
    socket.on("call:reject", onReject);
    socket.on("call:end", onEnd);
    socket.on("call:signal", onSignal);
    return () => {
      socket.off("call:invite", onInvite);
      socket.off("call:accept", onAccept);
      socket.off("call:reject", onReject);
      socket.off("call:end", onEnd);
      socket.off("call:signal", onSignal);
    };
  }, [user, conversationId, cleanup, processSignal]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    state,
    callType,
    incoming,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    error,
    durationSec,
    otherPartyName,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
