import { Router } from "express";
import { leaderboard, listSaved, toggleSaved, savedIds } from "../controllers/users.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/leaderboard", protect, leaderboard);
router.get("/me/saved", protect, listSaved);
router.get("/me/saved/ids", protect, savedIds);
router.post("/me/saved/:itemType/:itemId", protect, toggleSaved);

export default router;
