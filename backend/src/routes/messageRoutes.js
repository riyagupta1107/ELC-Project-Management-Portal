import express from "express";
import Message from "../models/Message.js";
import { requireUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch all messages for a specific project
router.get("/:projectId", requireUser, async (req, res) => {
    try {
        const messages = await Message.find({ projectId: req.params.projectId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching messages" });
    }
});

export default router;