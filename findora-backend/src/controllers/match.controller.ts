import crypto from "crypto";
import { Response } from "express";
import mongoose from "mongoose";
import QRCode from "qrcode";
import Handover from "../models/Handover.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { sendItemReturnedEmail } from "../services/email.service.js";

const HANDOVER_TTL_MS = 15 * 60 * 1000;

function isMatchParty(match: { lostOwner: unknown; foundOwner: unknown }, userId: string) {
  return String(match.lostOwner) === userId || String(match.foundOwner) === userId;
}

function redactOtherUsersReport(matchData: Record<string, unknown>, viewerId: string) {
  for (const key of ["lostItem", "foundItem"]) {
    const value = matchData[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;

    const report = value as Record<string, unknown>;
    if (String(report.owner) === viewerId) continue;

    delete report.contactPhone;
    if (Array.isArray(report.verificationQuestions)) {
      report.verificationQuestions = report.verificationQuestions.map((entry) => {
        if (!entry || typeof entry !== "object" || !("question" in entry)) return {};
        return { question: entry.question };
      });
    }
  }
}

export const myMatches = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await Match.find({
      $or: [{ lostOwner: req.user!.id }, { foundOwner: req.user!.id }],
    })
      .sort({ score: -1, createdAt: -1 })
      .populate("lostItem")
      .populate("foundItem")
      .populate("lostOwner", "name avatar trustPoints badge lastSeen")
      .populate("foundOwner", "name avatar trustPoints badge lastSeen");

    const data = matches.map((match) => {
      const result = match.toObject() as unknown as Record<string, unknown>;
      redactOtherUsersReport(result, req.user!.id);
      return result;
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const updateMatchStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body as { status?: unknown };
    if (status !== "confirmed" && status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed or rejected status can be set directly",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (!isMatchParty(match, req.user!.id)) {
      return res.status(403).json({ success: false, message: "Not part of this match" });
    }
    if (match.status !== "suggested") {
      return res.status(409).json({ success: false, message: "This match can no longer be updated" });
    }

    match.status = status;
    await match.save();

    const io = req.app.get("io");
    io?.to(String(match.lostOwner)).emit("match:updated", match);
    io?.to(String(match.foundOwner)).emit("match:updated", match);

    res.status(200).json({ success: true, message: "Match updated", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const createHandover = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (!isMatchParty(match, req.user!.id)) {
      return res.status(403).json({ success: false, message: "Not part of this match" });
    }
    if (match.status !== "confirmed") {
      return res.status(409).json({ success: false, message: "Confirm the match before starting a handover" });
    }
    if (String(match.lostOwner) === String(match.foundOwner)) {
      return res.status(409).json({ success: false, message: "A handover requires two different users" });
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + HANDOVER_TTL_MS);
    await Handover.findOneAndUpdate(
      { match: match._id },
      {
        $set: {
          createdBy: req.user!.id,
          tokenHash,
          expiresAt,
          confirmedBy: [],
          completedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const handoverUrl = `${frontendUrl}/matches#handover=${match.id}.${token}`;
    const qrCode = await QRCode.toDataURL(handoverUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
    });

    res.status(201).json({
      success: true,
      data: { token, qrCode, expiresAt },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const confirmHandover = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body as { token?: unknown };
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return res.status(400).json({ success: false, message: "A valid handover QR token is required" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (!isMatchParty(match, req.user!.id)) {
      return res.status(403).json({ success: false, message: "Not part of this match" });
    }
    if (match.status !== "confirmed") {
      return res.status(409).json({ success: false, message: "This match is not awaiting a handover" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const handover = await Handover.findOne({
      match: match._id,
      tokenHash,
      expiresAt: { $gt: now },
      completedAt: null,
    });
    if (!handover) {
      return res.status(400).json({ success: false, message: "This handover QR has expired or is invalid" });
    }

    await Handover.updateOne(
      { _id: handover._id, expiresAt: { $gt: now }, completedAt: null },
      { $addToSet: { confirmedBy: req.user!.id } }
    );
    const updatedHandover = await Handover.findById(handover._id).select("confirmedBy expiresAt");
    if (!updatedHandover) {
      return res.status(404).json({ success: false, message: "Handover no longer exists" });
    }

    const confirmedIds = new Set(updatedHandover.confirmedBy.map(String));
    const bothConfirmed =
      confirmedIds.has(String(match.lostOwner)) && confirmedIds.has(String(match.foundOwner));
    let returned = false;

    if (bothConfirmed) {
      const completedMatch = await Match.findOneAndUpdate(
        { _id: match._id, status: "confirmed" },
        { $set: { status: "returned" } },
        { new: true }
      );

      if (completedMatch) {
        returned = true;
        await Handover.updateOne(
          { _id: updatedHandover._id, completedAt: null },
          { $set: { completedAt: new Date() } }
        );
        await Promise.all([
          User.findByIdAndUpdate(match.lostOwner, { $inc: { trustPoints: 10 } }),
          User.findByIdAndUpdate(match.foundOwner, { $inc: { trustPoints: 15 } }),
        ]);

        const io = req.app.get("io");
        io?.to("admins").emit("admin:activity", {
          id: `returned-${match._id}`,
          kind: "returned",
          message: "An item handover was confirmed by both participants.",
          at: new Date().toISOString(),
        });

        const participantIds = [String(match.lostOwner), String(match.foundOwner)];
        for (const userId of participantIds) {
          const notification = await Notification.create({
            user: userId,
            type: "returned",
            title: "Handover confirmed",
            body: "Both participants confirmed the return. The match is now closed.",
          });
          io?.to(userId).emit("notification:new", notification);
          io?.to(userId).emit("match:updated", completedMatch);

          const user = await User.findById(userId).select("email name");
          if (user) void sendItemReturnedEmail(user.email, user.name);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: returned
        ? "Both participants confirmed the handover"
        : "Your confirmation was saved; the other participant must also confirm",
      data: { returned, confirmedByCurrentUser: true, expiresAt: updatedHandover.expiresAt },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
