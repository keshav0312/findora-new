import { Router } from "express";
import {
  createFoundItem,
  listFoundItems,
  myFoundItems,
  getFoundItem,
  updateFoundItem,
  deleteFoundItem,
  resolveFoundItem,
} from "../controllers/found.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", listFoundItems);
router.get("/mine", protect, myFoundItems);
router.get("/:id", getFoundItem);
router.post("/", protect, upload.array("photos", 5), createFoundItem);
router.patch("/:id", protect, updateFoundItem);
router.patch("/:id/resolve", protect, resolveFoundItem);
router.delete("/:id", protect, deleteFoundItem);

export default router;
