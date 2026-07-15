import express from "express";
import { 
    applyForProject, 
    getStudentApplications, 
    getProjectApplications,      
    updateApplicationStatus,
    withdrawApplication 
} from "../controllers/applicationController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";


const router = express.Router();

router.post("/apply", requireUser, requireRole("STUDENT"), applyForProject);
router.get("/my-applications", requireUser, requireRole("STUDENT"), getStudentApplications);

router.get("/project/:projectId", requireUser, requireRole("FACULTY"), getProjectApplications);
router.put("/:applicationId/status", requireUser, requireRole("FACULTY"), updateApplicationStatus);
router.delete("/:id", requireUser, requireRole("STUDENT"), withdrawApplication);

export default router;
