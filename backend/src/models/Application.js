import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    studentUid: {
        type: String, // Stores the student's MongoDB _id as a string
        required: true
    },
    professorUid: {
        type: String, // Stores the professor's MongoDB _id as a string
        required: true
    },
    message: {
        type: String,
        required: true
    },
    resumeLink: {
        type: String,
        default: ""
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