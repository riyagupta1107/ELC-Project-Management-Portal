import express from "express";
import { createNotice, getAllNotices } from "../controllers/noticeController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// Both students and faculty can view notices
router.get("/", requireUser, getAllNotices);

// ONLY faculty can create notices
router.post("/add", requireUser, requireRole("FACULTY"), createNotice);

export default router;