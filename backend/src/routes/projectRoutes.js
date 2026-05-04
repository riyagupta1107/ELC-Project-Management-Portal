import express from "express";
import { addProject, getAllProjects, updateProject, deleteProject, getProjects, getProjectById, draftProjectDescription } from "../controllers/projectController.js";
import { requireUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post("/draft", requireUser, requireRole("FACULTY"), draftProjectDescription);
router.post("/add", requireUser, requireRole("FACULTY"), addProject);
router.get("/my-prof-projects", requireUser, requireRole("FACULTY"), getProjects);
router.get("/all-projects", requireUser, getAllProjects);
router.get("/:id", requireUser, getProjectById);
router.put("/:id", requireUser, requireRole("FACULTY"), updateProject);
router.delete("/:id", requireUser, requireRole("FACULTY"), deleteProject);
export default router;