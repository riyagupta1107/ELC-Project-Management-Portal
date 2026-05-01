import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Project", 
        required: true 
    },
    senderUid: { 
        type: String, 
        required: true 
    },
    senderName: { 
        type: String, 
        required: true // Storing the name here saves us from doing heavy database lookups on every single message!
    },
    text: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model("Message", messageSchema);