import Project from "../models/Project.js";
import User from "../models/User.js";

// Add a new project
export const addProject = async(req,res) => {
    try {
        const {title, domain, description, students, status} = req.body;
        const professorUid = req.user.firebaseUid;

        if (!title || !description || !domain) {
            return res.status(400).json({message: "Title, Domain and Description are required"});
        }
        const domainArray = Array.isArray(domain) ? domain : [domain];

        const newProject = await Project.create({
            title, domain: domainArray, description, students: students || 1, status: status || "Ongoing", professorUid, enrolledStudents: []
        });
        res.status(201).json(newProject);
    } catch(error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all projects
export const getAllProjects = async(req,res) => {
    try {
        const projects = await Project.find().sort({createdAt: -1}).lean();
        const professorUids = projects.map(p => p.professorUid);
        const professors = await User.find({ firebaseUid: { $in: professorUids } }).select('firebaseUid firstName lastName');

        const professorMap = {};
        professors.forEach(prof => {
            professorMap[prof.firebaseUid] = `${prof.firstName} ${prof.lastName}`;
        });

        const projectsWithNames = projects.map(p => ({
            ...p,
            professorName: professorMap[p.professorUid] || "Professor"
        }));

        res.status(200).json(projectsWithNames);
    } catch(error) {
        res.status(500).json({message: "Server error"});
    }
}

// Get projects for a professor
export const getProjects = async(req,res) => {
    try {
        const professorUid = req.user.firebaseUid;
        const projects = await Project.find({professorUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

// Get projects for a student
export const getStudentProjects = async(req,res) => {
    try {
        const studentUid = req.user.firebaseUid;
        const projects = await Project.find({enrolledStudents: studentUid}).sort({createdAt: -1});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({message: "Server Error"});
    }
};

export const getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // Find the project by its MongoDB _id
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Fetch the professor's name using their firebaseUid
        const professor = await User.findOne({ firebaseUid: project.professorUid });
        
        // Convert the Mongoose document to a plain JavaScript object so we can append data
        const projectData = project.toObject();
        
        if (professor) {
            projectData.professorName = `${professor.firstName} ${professor.lastName}`;
        }

        res.status(200).json(projectData);
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        
        // If the ID is completely invalid/malformed, Mongoose throws a CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid project ID format." });
        }
        
        res.status(500).json({ message: "Server error while fetching project details." });
    }
};