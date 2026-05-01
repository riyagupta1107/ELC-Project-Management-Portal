import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorUid: { type: String, required: true },
    authorName: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notice", noticeSchema);