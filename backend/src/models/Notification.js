import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipientUid: { 
        type: String, 
        required: true // The firebaseUid of the person receiving the alert
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ["NEW_APPLICATION", "STATUS_UPDATE", "GENERAL"], 
        default: "GENERAL" 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    link: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model("Notification", notificationSchema);