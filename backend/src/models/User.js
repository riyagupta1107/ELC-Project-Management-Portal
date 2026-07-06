// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ["STUDENT", "FACULTY"],
    },
    phone: String,
    bio: String,
    resumeLink: String
}, { timestamps: true });

export default mongoose.model("User", userSchema);