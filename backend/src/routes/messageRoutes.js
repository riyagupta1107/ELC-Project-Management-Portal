import express from "express";
import Message from "../models/Message.js";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import { requireUser } from "../middleware/authMiddleware.js";

const router = express.Router();

const requireProjectParticipant = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.projectId).select("professorUid enrolledStudents");
        if (!project) return res.status(404).json({ message: "Project not found" });
        const userId = req.user._id.toString();
        const accepted = await Application.exists({ projectId: project._id, studentUid: userId, status: "Accepted" });
        if (project.professorUid !== userId && !project.enrolledStudents.includes(userId) && !accepted) {
            return res.status(403).json({ message: "Project membership is required" });
        }
        next();
    } catch {
        res.status(400).json({ message: "Invalid project ID" });
    }
};

// Fetch all messages for a specific project
router.get("/:projectId", requireUser, requireProjectParticipant, async (req, res) => {
    try {
        const messages = await Message.find({ projectId: req.params.projectId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching messages" });
    }
});

router.post("/:projectId", requireUser, requireProjectParticipant, async (req, res) => {
    try {
        const text = req.body.text?.trim();
        if (!text) return res.status(400).json({ message: "Message text is required" });
        const message = await Message.create({
            projectId: req.params.projectId,
            senderUid: req.user._id.toString(),
            senderName: `${req.user.firstName} ${req.user.lastName}`,
            text,
        });
        req.app.get("socketio")?.to(`project:${req.params.projectId}`).emit("receiveMessage", message);
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: "Error sending message" });
    }
});

export default router;
