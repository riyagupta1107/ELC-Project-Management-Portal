import Project from "../models/Project.js";

// Add a new project
export const addProject = async(req,res) => {
    try {
        const {title, description, students, status} = req.body;
        const professorUid = req.user.firebaseUid;

        if (!title || !description) {
            return res.status(400).json({message: "Title and Description are required"});
        }

        const newProject = await Project.create({
            title, description, students: students || 1, status: status || "Ongoing", professorUid, enrolledStudents: []
        });
        res.status(201).json(newProject);
    } catch(error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get projects
export const getProjects = async(req,res) => {
    try {
        const professorUid = req.user.firebaseUid;
        const projects = await Project.find({professorUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

// Get projects for Students
export const getStudentProjects = async(req,res) => {
    try {
        const studentUid = req.user.firebaseUid;
        const projects = await Project.find({enrolledStudents: studentUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({message: "Server Error"});
    }
};