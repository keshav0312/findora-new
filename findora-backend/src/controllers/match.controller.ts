import { Response } from "express";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { sendItemReturnedEmail } from "../services/email.service.js";

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

    res.status(200).json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const updateMatchStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // confirmed | rejected | returned
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const isParty =
      String(match.lostOwner) === String(req.user!.id) ||
      String(match.foundOwner) === String(req.user!.id);
    if (!isParty) {
      return res.status(403).json({ success: false, message: "Not part of this match" });
    }

    match.status = status;
    await match.save();

    const io = req.app.get("io");

    if (status === "returned") {
      await User.findByIdAndUpdate(match.lostOwner, { $inc: { trustPoints: 10 } });
      await User.findByIdAndUpdate(match.foundOwner, { $inc: { trustPoints: 15 } });

      const populated = await match.populate<{ lostItem: any }>("lostItem");
      const itemTitle = (populated as any).lostItem?.title || "your item";

      io?.to("admins").emit("admin:activity", {
        id: `returned-${match._id}`,
        kind: "returned",
        message: `Item returned: "${itemTitle}"`,
        at: new Date().toISOString(),
      });

      for (const uid of [match.lostOwner, match.foundOwner]) {
        const notification = await Notification.create({
          user: uid,
          type: "returned",
          title: "Item marked as returned",
          body: "Great news — this report has been closed as returned.",
        });
        io?.to(String(uid)).emit("notification:new", notification);

        const user = await User.findById(uid);
        if (user) sendItemReturnedEmail(user.email, user.name, itemTitle).catch(() => {});
      }
    } else {
      io?.to(String(match.lostOwner)).emit("match:updated", match);
      io?.to(String(match.foundOwner)).emit("match:updated", match);
    }

    res.status(200).json({ success: true, message: "Match updated", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
