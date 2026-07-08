import { Router } from "express";
import { myMatches, updateMatchStatus } from "../controllers/match.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, myMatches);
router.patch("/:id", protect, updateMatchStatus);

export default router;
