import express from "express";
import { addProject, getAllProjects, getProjects, updateProject, deleteProject } from "../controllers/projectController.js";
import { getProjectById } from "../controllers/projectController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post("/add", requireUser, requireRole("FACULTY"), addProject);
router.get("/my-prof-projects", requireUser, requireRole("FACULTY"), getProjects);
router.get("/all-projects", requireUser, getAllProjects);
router.get("/:id", requireUser, getProjectById);
router.put("/:id", requireUser, requireRole("FACULTY"), updateProject);
router.delete("/:id", requireUser, requireRole("FACULTY"), deleteProject);
export default router;