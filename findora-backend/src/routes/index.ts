import { Router } from "express";
import authRoutes from "./auth.routes.js";
import lostRoutes from "./lost.routes.js";
import foundRoutes from "./found.routes.js";
import matchRoutes from "./match.routes.js";
import messageRoutes from "./message.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

router.use("/auth", authRoutes);
router.use("/lost", lostRoutes);
router.use("/found", foundRoutes);
router.use("/matches", matchRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/users", usersRoutes);

export default router;
