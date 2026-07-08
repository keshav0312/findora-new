import { Router } from "express";
import {
  analytics,
  listUsers,
  createStaff,
  banUser,
  recentReports,
} from "../controllers/admin.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, restrictTo("admin", "police"));

router.get("/analytics", analytics);
router.get("/reports", recentReports);
router.get("/users", restrictTo("admin"), listUsers);
router.post("/users", restrictTo("admin"), createStaff);
router.patch("/users/:id/ban", restrictTo("admin"), banUser);

export default router;
