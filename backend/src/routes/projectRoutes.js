import express from "express";
import {addProject, getAllProjects, getProjects} from "../controllers/projectController.js";
import {requireUser} from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/add", requireUser, addProject);
router.get("/my-prof-projects", requireUser, getProjects);
router.get("/all-projects", requireUser, getAllProjects);

export default router;