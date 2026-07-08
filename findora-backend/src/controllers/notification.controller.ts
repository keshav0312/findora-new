import { Response } from "express";
import Notification from "../models/Notification.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ user: req.user!.id, read: false });
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await Notification.findOneAndUpdate(
      { _id: id, user: req.user!.id },
      { read: true }
    );
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
