import express from "express";
import {addProject, getProjects} from "../controllers/projectController.js";
import {requireUser} from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/add", requireUser, addProject);
router.get("/professor", requireUser, getProjects);

export default router;