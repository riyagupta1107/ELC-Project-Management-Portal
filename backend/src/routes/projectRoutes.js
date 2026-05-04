import express from "express";
import { addProject, getAllProjects, getProjects, getProjectById, draftProjectDescription } from "../controllers/projectController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post("/draft", requireUser, requireRole("FACULTY"), draftProjectDescription);
router.post("/add", requireUser, requireRole("FACULTY"), addProject);
router.get("/my-prof-projects", requireUser, requireRole("FACULTY"), getProjects);
router.get("/all-projects", requireUser, getAllProjects);
router.get("/:id", requireUser, getProjectById);
export default router;