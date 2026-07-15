import Notice from "../models/Notice.js";
import Notification from "../models/Notification.js"; 
import User from "../models/User.js"; 
//import { getIO } from "../../server.js"; 

export const createNotice = async (req, res) => {
    try {
        const { title, content } = req.body;
        const authorUid = req.user._id.toString();
        const authorName = `Prof. ${req.user.firstName || req.user.lastName}`;

        // 1. Save the Notice (for the Announcements/Notices page)
        const newNotice = await Notice.create({
            title,
            content,
            authorUid,
            authorName
        });

        // 2. Fetch all students to create persistent notifications
        const students = await User.find({ role: "STUDENT" }).select("_id");

        // 3. Prepare Notification objects for the database
        const notificationsToSave = students.map(student => ({
            recipientUid: student._id.toString(),
            title: `New Notice: ${title}`,
            message: `${authorName} posted a new announcement.`,
            type: "GENERAL",
            link: "/student-dashboard",
            isRead: false
        }));

        // 4. Save all notifications to DB so they persist even when students are offline
        await Notification.insertMany(notificationsToSave);

        // 5. Trigger Real-time Socket Broadcast
        const io = req.app.get('socketio'); 
        
        if (io) {
            students.forEach((student) => {
                io.to(`user:${student._id}`).emit("newNotification", {
                    title: `New Notice: ${title}`,
                    message: `${authorName} posted a new announcement.`,
                    createdAt: new Date()
                });
            });
        }

        res.status(201).json(newNotice);
    } catch (error) {
        // CRITICAL: Log the error to your terminal to debug the 500 status
        console.error("Error in createNotice:", error);
        res.status(500).json({ message: "Server error creating notice", error: error.message });
    }
};
export const getAllNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching notices" });
    }
};
