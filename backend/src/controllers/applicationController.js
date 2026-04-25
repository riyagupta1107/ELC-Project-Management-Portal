import Application from "../models/Application.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

export const applyForProject = async (req, res) => {
    try {
        const { projectId, message, resumeLink } = req.body;
        const studentUid = req.user.firebaseUid || req.user.uid;

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const newApp = new Application({
            projectId,
            studentUid,
            professorUid: project.professorUid,
            message: message || "I am interested in this project.",
            resumeLink: resumeLink || "",
        });

        await newApp.save();
        res.status(201).json(newApp);
    } catch (error) {
        console.error("Apply Error:", error);
        res.status(500).json({ message: "Server Error while applying." });
    }
};

export const getStudentApplications = async (req, res) => {
    try {
        // Fetch apps and populate the project details so the frontend can display them
        const applications = await Application.find({ studentUid: req.user.firebaseUid || req.user.uid })
            .populate('projectId', 'title description domain professorUid');
        
        // Format the data to match what the StudentDashboard frontend expects
        const formattedApps = applications.map(app => ({
            _id: app._id,
            projectId: app.projectId._id,
            projectTitle: app.projectId.title,
            projectDescription: app.projectId.description,
            projectDomain: app.projectId.domain,
            status: app.status,
            appliedAt: app.appliedAt
        }));

        res.status(200).json(formattedApps);
    } catch (error) {
        console.error("Fetch Apps Error:", error);
        res.status(500).json({ message: "Server Error fetching applications." });
    }
};

export const getProjectApplications = async(req,res) => {
    try {
        const {projectId} = req.params;
        const applications = await Application.find({ projectId });

        const formattedApps = await Promise.all(applications.map(async (app) => {
            const student = await User.findOne({ firebaseUid: app.studentUid });
            return {
                ...app.toObject(),
                studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
                studentEmail: student ? student.email : "Unknown Email"
            };
        }));

        res.status(200).json(formattedApps);
    } catch (error) {
        console.error("Fetch Project Apps Error:", error);
        res.status(500).json({ message: "Server Error fetching applications." });
    }
};
export const updateApplicationStatus = async(req,res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const application = await Application.findById(applicationId);
        if (!application) return res.status(404).json({ message: "Application not found" });

        application.status = status;
        await application.save();

        if (status === "Accepted") {
            const project = await Project.findById(application.projectId);
            
            if (project) {
                if (!project.enrolledStudents) {
                    project.enrolledStudents = [];
                }
                
                if (!project.enrolledStudents.includes(application.studentUid)) {
                    project.enrolledStudents.push(application.studentUid);
                    await project.save();
                }
            }
        }

        res.status(200).json({ message: `Application ${status} successfully`, application });
    } catch(error) {
        console.error("Update App Status Error:", error);
        res.status(500).json({ message: "Server Error updating application." });
    }
}