import Project from "../models/Project.js";
import User from "../models/User.js";
import Application from "../models/Application.js";

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
// Get all projects with Pagination and Filtering
export const getAllProjects = async (req, res) => {
    try {
        // 1. Get query parameters from the frontend URL (defaults to page 1, 9 items)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9; 
        const search = req.query.search || '';
        const domain = req.query.domain || '';

        // 2. Build the MongoDB Query Object
        const query = {};

        // If they selected a specific domain, filter by it
        if (domain && domain !== 'All Domains') {
            query.domain = domain;
        }

        // If they typed in a search term
        if (search) {
            // Smart Search: First, check if the search term matches any Professor's name
            const matchedProfessors = await User.find({
                role: "FACULTY",
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            }).select('firebaseUid');

            // Extract just their UIDs
            const matchedProfessorUids = matchedProfessors.map(prof => prof.firebaseUid);

            // Now, search for Projects where the Title OR Description OR Professor matches
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { professorUid: { $in: matchedProfessorUids } }
            ];
        }

        // 3. Calculate how many projects to skip based on the page number
        const skip = (page - 1) * limit;

        // 4. Fetch ONLY the specific page of projects from MongoDB
        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 5. Get the total count for the frontend pagination math
        const totalProjects = await Project.countDocuments(query);
        const totalPages = Math.ceil(totalProjects / limit);

        // 6. Map Professor Names to the 9 fetched projects (Same as before)
        const professorUids = projects.map(p => p.professorUid);
        const professors = await User.find({ firebaseUid: { $in: professorUids } }).select('firebaseUid firstName lastName');

        const professorMap = {};
        professors.forEach(prof => {
            professorMap[prof.firebaseUid] = `${prof.firstName} ${prof.lastName}`;
        });

        const projectsWithNames = projects.map(p => ({
            ...p,
            professorName: professorMap[p.professorUid] || "Unknown Professor"
        }));

        // Send back the projects AND the pagination data
        res.status(200).json({
            projects: projectsWithNames,
            currentPage: page,
            totalPages: totalPages,
            totalProjects: totalProjects
        });

    } catch (error) {
        console.error("Error fetching all projects:", error);
        res.status(500).json({ message: "Server error while fetching projects" });
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

// Update a project (Edit details or change status to Completed)
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const professorUid = req.user.firebaseUid;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Security: Ensure only the professor who created it can edit it
        if (project.professorUid !== professorUid) {
            return res.status(403).json({ message: "Unauthorized to edit this project" });
        }

        const updatedProject = await Project.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });        res.status(200).json(updatedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Server error updating project" });
    }
};

// Delete a project securely
// Delete a project securely
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const professorUid = req.user.firebaseUid;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Security check
        if (project.professorUid !== professorUid) {
            return res.status(403).json({ message: "Unauthorized to delete this project" });
        }

        await Project.findByIdAndDelete(id);
        
        // Delete all applications associated with this project so they don't become ghost records!
        await Application.deleteMany({ projectId: id }); // <-- Now it just uses the model imported at the top

        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Server error deleting project" });
    }
};