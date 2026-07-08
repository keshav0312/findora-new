import { Router } from "express";
import {
  createLostItem,
  listLostItems,
  myLostItems,
  getLostItem,
  updateLostItem,
  deleteLostItem,
  resolveLostItem,
} from "../controllers/lost.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", listLostItems);
router.get("/mine", protect, myLostItems);
router.get("/:id", getLostItem);
router.post("/", protect, upload.array("photos", 5), createLostItem);
router.patch("/:id", protect, updateLostItem);
router.patch("/:id/resolve", protect, resolveLostItem);
router.delete("/:id", protect, deleteLostItem);

export default router;
