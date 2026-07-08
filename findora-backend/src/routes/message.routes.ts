import { Router } from "express";
import {
  getConversation,
  sendMessage,
  sendAttachment,
  sendLocation,
  myConversations,
  markConversationRead,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { chatUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", protect, myConversations);
router.get("/:matchId", protect, getConversation);
router.post("/", protect, sendMessage);
router.post("/upload", protect, chatUpload.single("file"), sendAttachment);
router.post("/location", protect, sendLocation);
router.post("/:matchId/read", protect, markConversationRead);

export default router;
