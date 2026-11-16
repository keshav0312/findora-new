import { Router } from "express";
import {
  confirmHandover,
  createHandover,
  myMatches,
  updateMatchStatus,
} from "../controllers/match.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, myMatches);
router.post("/:id/handover", protect, createHandover);
router.post("/:id/handover/confirm", protect, confirmHandover);
router.patch("/:id", protect, updateMatchStatus);

export default router;
