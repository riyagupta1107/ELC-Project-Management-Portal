import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    studentUid: {
        type: String, // Matches the firebaseUid in your User model
        required: true
    },
    professorUid: {
        type: String, // Helps the professor quickly fetch their pending apps
        required: true
    },
    message: {
        type: String,
        required: true // From your modal's text area
    },
    resumeLink: {
        type: String,
        default: "" // From your modal's optional input
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending"
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Application", applicationSchema);