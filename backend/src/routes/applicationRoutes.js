import express from "express";
import { 
    applyForProject, 
    getStudentApplications, 
    getProjectApplications,      
    updateApplicationStatus      
} from "../controllers/applicationController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post("/apply", requireUser, applyForProject);
router.get("/my-applications", requireUser, getStudentApplications);

router.get("/project/:projectId", requireUser, requireRole("FACULTY"), getProjectApplications);
router.put("/:applicationId/status", requireUser, requireRole("FACULTY"), updateApplicationStatus);

export default router;