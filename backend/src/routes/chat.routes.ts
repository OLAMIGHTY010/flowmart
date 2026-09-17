import { Router } from "express";
import {
  createOrGetConversation,
  getConversations,
  getMessages,
  sendMessage,
  respondToOffer
} from "../controllers/chat.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.post("/conversations", createOrGetConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);
router.post("/messages/:id/accept-offer", respondToOffer);

export default router;
