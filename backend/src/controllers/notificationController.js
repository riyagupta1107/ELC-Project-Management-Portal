import Notification from "../models/Notification.js";

// Make sure 'export' is at the start of the function
export const getUserNotifications = async (req, res) => {
    try {
        const uid = req.user._id.toString();
        const notifications = await Notification.find({ recipientUid: uid }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the notification first so we can verify ownership
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Security: only the intended recipient can mark it as read
        if (notification.recipientUid !== req.user._id.toString()) {
            return res.status(403).json({ message: "Forbidden" });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification" });
    }
};