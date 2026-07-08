import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import Bookmark from "../models/Bookmark.js";
import LostItem from "../models/LostItem.js";
import FoundItem from "../models/FoundItem.js";

/** GET /api/users/leaderboard — top members by trust points earned. */
export const leaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: "user" })
      .sort({ trustPoints: -1 })
      .limit(20)
      .select("name avatar city trustPoints badge createdAt");

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

/** GET /api/users/me/saved — all items the current user has bookmarked. */
export const listSaved = async (req: AuthRequest, res: Response) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user!.id }).sort({ createdAt: -1 });

    const lostIds = bookmarks.filter((b) => b.itemType === "lost").map((b) => b.item);
    const foundIds = bookmarks.filter((b) => b.itemType === "found").map((b) => b.item);

    const [lostItems, foundItems] = await Promise.all([
      LostItem.find({ _id: { $in: lostIds } }).populate("owner", "name avatar"),
      FoundItem.find({ _id: { $in: foundIds } }).populate("owner", "name avatar"),
    ]);

    const items = [
      ...lostItems.map((i) => ({ ...i.toObject(), kind: "lost" as const })),
      ...foundItems.map((i) => ({ ...i.toObject(), kind: "found" as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

/** POST /api/users/me/saved/:itemType/:itemId — toggle a bookmark on/off. */
export const toggleSaved = async (req: AuthRequest, res: Response) => {
  try {
    const { itemType, itemId } = req.params;
    if (itemType !== "lost" && itemType !== "found") {
      return res.status(400).json({ success: false, message: "itemType must be 'lost' or 'found'" });
    }

    const existing = await Bookmark.findOne({ user: req.user!.id, itemType, item: itemId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, saved: false });
    }

    await Bookmark.create({ user: req.user!.id, itemType, item: itemId });
    res.status(201).json({ success: true, saved: true });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

/** GET /api/users/me/saved/ids — lightweight list of bookmarked IDs for UI state. */
export const savedIds = async (req: AuthRequest, res: Response) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user!.id }).select("itemType item");
    res.status(200).json({
      success: true,
      data: bookmarks.map((b) => `${b.itemType}:${b.item}`),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
