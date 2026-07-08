import { Response } from "express";
import User from "../models/User.js";
import LostItem from "../models/LostItem.js";
import FoundItem from "../models/FoundItem.js";
import Match from "../models/Match.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const analytics = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, lostCount, foundCount, resolvedLost, resolvedFound, matches] =
      await Promise.all([
        User.countDocuments(),
        LostItem.countDocuments(),
        FoundItem.countDocuments(),
        LostItem.countDocuments({ status: "closed" }),
        FoundItem.countDocuments({ status: "closed" }),
        Match.countDocuments(),
      ]);

    const categoryAgg = await LostItem.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const cityAgg = await LostItem.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Last 6 months of combined lost+found report volume, for the
    // "Reports Overview" trend chart on the admin dashboard.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = async (model: typeof LostItem) =>
      model.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

    const [lostMonthly, foundMonthly] = await Promise.all([
      monthlyAgg(LostItem),
      monthlyAgg(FoundItem),
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const lostCount = lostMonthly.find((x) => x._id.y === y && x._id.m === m)?.count || 0;
      const foundCountM = foundMonthly.find((x) => x._id.y === y && x._id.m === m)?.count || 0;
      trend.push({ label: monthNames[d.getMonth()], value: lostCount + foundCountM });
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        lostCount,
        foundCount,
        resolvedCount: resolvedLost + resolvedFound,
        matches,
        recoveryRate:
          lostCount + foundCount > 0
            ? Math.round(((resolvedLost + resolvedFound) / (lostCount + foundCount)) * 100)
            : 0,
        topCategories: categoryAgg.map((c) => ({ category: c._id || "Other", count: c.count })),
        topCities: cityAgg.map((c) => ({ city: c._id || "Unknown", count: c.count })),
        trend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    // Modeled as role downgrade + isVerified=false; extend with a real
    // `status: banned` field if you need to fully lock accounts out.
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User restricted", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const recentReports = async (_req: AuthRequest, res: Response) => {
  try {
    const [lost, found] = await Promise.all([
      LostItem.find().sort({ createdAt: -1 }).limit(20).populate("owner", "name"),
      FoundItem.find().sort({ createdAt: -1 }).limit(20).populate("owner", "name"),
    ]);
    const combined = [
      ...lost.map((l) => ({ ...l.toObject(), type: "lost" })),
      ...found.map((f) => ({ ...f.toObject(), type: "found" })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ success: true, data: combined.slice(0, 30) });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
