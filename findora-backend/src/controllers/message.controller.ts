import { Response } from "express";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

function conversationIdFor(matchId: string) {
  return `match_${matchId}`;
}

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = String(req.params.matchId);
    const conversationId = conversationIdFor(matchId);
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, recipient, text } = req.body;
    if (!text || !recipient) {
      return res.status(400).json({ success: false, message: "recipient and text are required" });
    }

    const conversationId = conversationIdFor(matchId);
    const message = await Message.create({
      conversationId,
      sender: req.user!.id,
      recipient,
      matchId,
      text,
    });

    await Notification.create({
      user: recipient,
      type: "message",
      title: "New message",
      body: text.slice(0, 80),
      link: `/chat/${matchId}`,
    });

    // If a socket.io instance is attached to the app, emit in real-time too.
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("message:new", message);
      io.to(String(recipient)).emit("notification:new", {
        _id: `live-${message._id}`,
        type: "message",
        title: "New message",
        body: text.slice(0, 80),
        link: `/chat/${matchId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// Photo evidence or a recorded voice note attached to a chat message.
// Accepts multipart/form-data: file (required), matchId, recipient, text? (optional caption).
export const sendAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, recipient, text, kind, durationSeconds } = req.body;
    const file = req.file as any;
    if (!file || !recipient || !matchId) {
      return res.status(400).json({ success: false, message: "file, recipient and matchId are required" });
    }

    const attachmentKind: "image" | "audio" = kind === "audio" ? "audio" : "image";
    const conversationId = conversationIdFor(matchId);

    const message = await Message.create({
      conversationId,
      sender: req.user!.id,
      recipient,
      matchId,
      text: text || "",
      attachment: {
        kind: attachmentKind,
        url: `/uploads/${file.filename}`,
        durationSeconds: durationSeconds ? Number(durationSeconds) : 0,
      },
    });

    await Notification.create({
      user: recipient,
      type: "message",
      title: "New message",
      body: attachmentKind === "audio" ? "Sent a voice note" : "Sent a photo",
      link: `/chat/${matchId}`,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("message:new", message);
      io.to(String(recipient)).emit("notification:new", {
        _id: `live-${message._id}`,
        type: "message",
        title: "New message",
        body: attachmentKind === "audio" ? "Sent a voice note" : "Sent a photo",
        link: `/chat/${matchId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// A live location shared in chat: { matchId, recipient, lat, lng, label? }.
export const sendLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, recipient, lat, lng, label } = req.body;
    if (!recipient || !matchId || lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "matchId, recipient, lat and lng are required" });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ success: false, message: "lat and lng must be valid numbers" });
    }

    const conversationId = conversationIdFor(matchId);
    const message = await Message.create({
      conversationId,
      sender: req.user!.id,
      recipient,
      matchId,
      text: "",
      location: { lat: latitude, lng: longitude, label: label || "" },
    });

    await Notification.create({
      user: recipient,
      type: "message",
      title: "New message",
      body: "Shared a live location",
      link: `/chat/${matchId}`,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("message:new", message);
      io.to(String(recipient)).emit("notification:new", {
        _id: `live-${message._id}`,
        type: "message",
        title: "New message",
        body: "Shared a live location",
        link: `/chat/${matchId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const markConversationRead = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = String(req.params.matchId);
    const conversationId = conversationIdFor(matchId);
    await Message.updateMany(
      { conversationId, recipient: req.user!.id, read: false },
      { read: true }
    );

    const io = req.app.get("io");
    io?.to(conversationId).emit("message:read", { conversationId, userId: req.user!.id });

    res.status(200).json({ success: true, message: "Conversation marked read" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const myConversations = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user!.id }, { recipient: req.user!.id }],
    }).sort({ createdAt: -1 });

    const seen = new Set<string>();
    const conversations = [];
    for (const m of messages) {
      if (seen.has(m.conversationId)) continue;
      seen.add(m.conversationId);
      conversations.push(m);
    }
    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
