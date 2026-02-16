import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    title: {type:String, required: true},
    domain: {type: [String], required:true},
    description: {type: String, required: true},
    status: {type: String, enum: ["Ongoing", "Completed"], default:"Ongoing"},
    professorUid: {type: String, required: true},
    students: {type: Number, default: 1},
    enrolledStudents: [{type: String}],
    createdAt: {type: Date, default: Date.now},
})

export default mongoose.model("Project", projectSchema);