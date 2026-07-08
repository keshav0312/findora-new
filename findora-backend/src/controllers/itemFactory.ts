import { Response } from "express";
import { Model } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Notification from "../models/Notification.js";
import Match from "../models/Match.js";
import User from "../models/User.js";
import { computeMatch, MATCH_THRESHOLD } from "../utils/matching.js";
import { explainMatch } from "../services/ai.service.js";
import { sendMatchNotificationEmail } from "../services/email.service.js";

/**
 * Builds a set of Express handlers (create/list/get/update/delete/mine) for
 * an item model (LostItem or FoundItem). `oppositeModel` is the other
 * collection that new reports get cross-matched against.
 */
export function buildItemController(opts: {
  model: Model<any>;
  oppositeModel: Model<any>;
  kind: "lost" | "found";
}) {
  const { model, oppositeModel, kind } = opts;

  const create = async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body;
      const files = (req.files as any[]) || [];
      const photos = files.map((f: any) => `/uploads/${f.filename}`);

      let verificationQuestions = [];
      if (body.verificationQuestions) {
        try {
          verificationQuestions =
            typeof body.verificationQuestions === "string"
              ? JSON.parse(body.verificationQuestions)
              : body.verificationQuestions;
        } catch {
          verificationQuestions = [];
        }
      }

      const item = await model.create({
        title: body.title,
        category: body.category,
        description: body.description,
        color: body.color,
        brand: body.brand,
        location: body.location,
        city: body.city,
        coordinates: {
          lat: body.lat ? Number(body.lat) : null,
          lng: body.lng ? Number(body.lng) : null,
        },
        date: body.date,
        reward: body.reward ? Number(body.reward) : 0,
        photos,
        verificationQuestions,
        owner: req.user!.id,
      });

      // Cross-match against the opposite collection (open reports only).
      const candidates = await oppositeModel
        .find({ status: "open" })
        .limit(200)
        .lean();

      const createdMatches: any[] = [];
      const io = req.app.get("io");

      io?.to("admins").emit("admin:activity", {
        id: `report-${item._id}`,
        kind: "report",
        message: `${kind === "lost" ? "Lost" : "Found"} report filed: "${item.title}"`,
        city: item.city,
        at: new Date().toISOString(),
      });

      for (const candidate of candidates) {
        const { score, breakdown } = computeMatch(item.toObject(), candidate);
        if (score >= MATCH_THRESHOLD) {
          const lostItemId = kind === "lost" ? item._id : candidate._id;
          const foundItemId = kind === "found" ? item._id : candidate._id;
          const lostOwner = kind === "lost" ? item.owner : candidate.owner;
          const foundOwner = kind === "found" ? item.owner : candidate.owner;
          const lostTitle = kind === "lost" ? item.title : candidate.title;
          const foundTitle = kind === "found" ? item.title : candidate.title;
          const lostLocation = kind === "lost" ? item.location : candidate.location;
          const foundLocation = kind === "found" ? item.location : candidate.location;

          // Ask Groq for a short, human-readable "why this is a match"
          // explanation. Falls back to a template if GROQ_API_KEY isn't set.
          const aiExplanation = await explainMatch({
            lostTitle,
            foundTitle,
            category: item.category,
            lostLocation,
            foundLocation,
            score,
            breakdown,
          });

          const match = await Match.findOneAndUpdate(
            { lostItem: lostItemId, foundItem: foundItemId },
            { score, breakdown, lostOwner, foundOwner, status: "suggested", aiExplanation },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          createdMatches.push(match);

          io?.to("admins").emit("admin:activity", {
            id: `match-${match._id}`,
            kind: "match",
            message: `${score}% match found: "${lostTitle}" ↔ "${foundTitle}"`,
            city: item.city,
            at: new Date().toISOString(),
          });

          for (const uid of [String(lostOwner), String(foundOwner)]) {
            if (uid === String(req.user!.id)) continue;

            const notification = await Notification.create({
              user: uid,
              type: "match",
              title: "Possible match found",
              body: `A ${score}% match was found for "${item.title}" — ${aiExplanation}`,
              link: `/matches`,
            });

            // Real-time push over Socket.IO to any connected client for this user.
            io?.to(uid).emit("notification:new", notification);

            // Also email the other party via Brevo so they don't have to be
            // online to find out about the match.
            const matchedUser = await User.findById(uid);
            if (matchedUser) {
              sendMatchNotificationEmail(
                matchedUser.email,
                matchedUser.name,
                item.title,
                score,
                aiExplanation
              ).catch(() => {});
            }
          }
        }
      }

      res.status(201).json({
        success: true,
        message: "Report submitted",
        data: item,
        matches: createdMatches.length,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const list = async (req: AuthRequest, res: Response) => {
    try {
      const { category, city, status, q, color, brand, page = "1", limit = "20" } = req.query as Record<string, string>;
      const filter: Record<string, any> = {};
      if (category) filter.category = category;
      if (city) filter.city = new RegExp(city, "i");
      if (status) filter.status = status;
      if (color) filter.color = new RegExp(color, "i");
      if (brand) filter.brand = new RegExp(brand, "i");
      if (q) filter.$text = { $search: q };

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      const [items, total] = await Promise.all([
        model
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate("owner", "name avatar trustPoints badge lastSeen"),
        model.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: items,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const mine = async (req: AuthRequest, res: Response) => {
    try {
      const items = await model.find({ owner: req.user!.id }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const getOne = async (req: AuthRequest, res: Response) => {
    try {
      const item = await model
        .findById(req.params.id)
        .populate("owner", "name avatar trustPoints badge lastSeen");
      if (!item) {
        return res.status(404).json({ success: false, message: `${kind} report not found` });
      }
      const obj = item.toObject();
      // Hide verification answers from everyone except the report owner.
      if (String(item.owner._id || item.owner) !== String(req.user?.id)) {
        obj.verificationQuestions = (obj.verificationQuestions || []).map((q: any) => ({
          question: q.question,
        }));
      }
      res.status(200).json({ success: true, data: obj });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const update = async (req: AuthRequest, res: Response) => {
    try {
      const item = await model.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: `${kind} report not found` });
      if (String(item.owner) !== String(req.user!.id) && req.user!.role === "user") {
        return res.status(403).json({ success: false, message: "Not your report" });
      }
      Object.assign(item, req.body);
      await item.save();
      res.status(200).json({ success: true, message: "Report updated", data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const remove = async (req: AuthRequest, res: Response) => {
    try {
      const item = await model.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: `${kind} report not found` });
      if (String(item.owner) !== String(req.user!.id) && req.user!.role === "user") {
        return res.status(403).json({ success: false, message: "Not your report" });
      }
      await item.deleteOne();
      res.status(200).json({ success: true, message: "Report deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  const markResolved = async (req: AuthRequest, res: Response) => {
    try {
      const item = await model.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: `${kind} report not found` });
      if (String(item.owner) !== String(req.user!.id) && req.user!.role === "user") {
        return res.status(403).json({ success: false, message: "Not your report" });
      }
      item.status = "closed";
      await item.save();
      res.status(200).json({ success: true, message: "Marked as returned/resolved", data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  return { create, list, mine, getOne, update, remove, markResolved };
}
