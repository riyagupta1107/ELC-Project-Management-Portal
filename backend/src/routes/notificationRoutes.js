import express from "express";
import { getUserNotifications, markAsRead } from "../controllers/notificationController.js";
import { requireUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireUser, getUserNotifications);
router.put("/:id/read", requireUser, markAsRead);

export default router;