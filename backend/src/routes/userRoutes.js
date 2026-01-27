import express from "express";
import { createUser, getUserProfile } from "../controllers/userController.js";
import { requireUser } from '../middleware/authMiddleware.js'

const router = express.Router();

router.post("/create", createUser);
router.get("/profile", requireUser, getUserProfile);

export default router;