// src/controllers/applicationController.js
import Application from "../models/Application.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";

// @desc    Student applies for a project
// @route   POST /api/applications/apply
export const applyForProject = async (req, res) => {
    try {
        const { projectId, message, resumeLink } = req.body;
        const studentUid = req.user._id.toString();

        if (!projectId || !message) {
            return res.status(400).json({ message: "Project ID and message are required" });
        }

        // Check the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Prevent duplicate applications
        const existingApplication = await Application.findOne({ projectId, studentUid });
        if (existingApplication) {
            return res.status(400).json({ message: "You have already applied for this project" });
        }

        const newApplication = await Application.create({
            projectId,
            studentUid,
            professorUid: project.professorUid,
            message,
            resumeLink: resumeLink || "",
        });

        // Notify the professor in real-time
        const io = req.app.get('socketio');
        if (io) {
            io.to(project.professorUid).emit("newNotification", {
                title: "New Application Received",
                message: `A student applied for your project: ${project.title}`,
                createdAt: new Date(),
            });
        }

        // Save a persistent notification for the professor
        await Notification.create({
            recipientUid: project.professorUid,
            title: "New Application Received",
            message: `A student applied for your project: ${project.title}`,
            type: "NEW_APPLICATION",
            link: `/manage-project/${projectId}`,
            isRead: false,
        });

        res.status(201).json(newApplication);
    } catch (error) {
        console.error("Error in applyForProject:", error);
        res.status(500).json({ message: "Server error submitting application" });
    }
};

// @desc    Get all applications submitted by the logged-in student
// @route   GET /api/applications/my-applications
export const getStudentApplications = async (req, res) => {
    try {
        const studentUid = req.user._id.toString();

        const applications = await Application.find({ studentUid })
            .populate("projectId", "title domain status professorUid")
            .sort({ appliedAt: -1 });

        res.status(200).json(applications);
    } catch (error) {
        console.error("Error in getStudentApplications:", error);
        res.status(500).json({ message: "Server error fetching your applications" });
    }
};

// @desc    Get all applications for a specific project (faculty only)
// @route   GET /api/applications/project/:projectId
export const getProjectApplications = async (req, res) => {
    try {
        const { projectId } = req.params;
        const professorUid = req.user._id.toString();

        // Verify the project belongs to this professor
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        if (project.professorUid !== professorUid) {
            return res.status(403).json({ message: "Forbidden: This is not your project" });
        }

        const applications = await Application.find({ projectId }).sort({ appliedAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        console.error("Error in getProjectApplications:", error);
        res.status(500).json({ message: "Server error fetching applications" });
    }
};

// @desc    Faculty accepts or rejects an application
// @route   PUT /api/applications/:applicationId/status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const professorUid = req.user._id.toString();

        if (!["Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'Accepted' or 'Rejected'" });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Only the owning professor can update the status
        if (application.professorUid !== professorUid) {
            return res.status(403).json({ message: "Forbidden" });
        }

        application.status = status;
        await application.save();

        // Notify the student of the decision
        const project = await Project.findById(application.projectId);
        const notificationMessage = status === "Accepted"
            ? `Congratulations! Your application for "${project?.title}" has been accepted.`
            : `Your application for "${project?.title}" was not selected this time.`;

        await Notification.create({
            recipientUid: application.studentUid,
            title: `Application ${status}`,
            message: notificationMessage,
            type: "STATUS_UPDATE",
            link: "/student-dashboard",
            isRead: false,
        });

        // Real-time socket ping to the student
        const io = req.app.get('socketio');
        if (io) {
            io.to(application.studentUid).emit("newNotification", {
                title: `Application ${status}`,
                message: notificationMessage,
                createdAt: new Date(),
            });
        }

        res.status(200).json({ message: `Application ${status.toLowerCase()} successfully`, application });
    } catch (error) {
        console.error("Error in updateApplicationStatus:", error);
        res.status(500).json({ message: "Server error updating application status" });
    }
};

// @desc    Student withdraws their own application
// @route   DELETE /api/applications/:id
export const withdrawApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const studentUid = req.user._id.toString();

        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Only the student who applied can withdraw
        if (application.studentUid !== studentUid) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Only allow withdrawal if still pending
        if (application.status !== "Pending") {
            return res.status(400).json({ message: "Cannot withdraw an application that has already been reviewed" });
        }

        await Application.findByIdAndDelete(id);
        res.status(200).json({ message: "Application withdrawn successfully" });
    } catch (error) {
        console.error("Error in withdrawApplication:", error);
        res.status(500).json({ message: "Server error withdrawing application" });
    }
};