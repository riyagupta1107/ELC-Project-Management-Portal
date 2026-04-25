import express from "express";
import { createUser, getUserProfile, getFaculties, updateUserProfile} from "../controllers/userController.js";
import { requireUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC: Anyone can create an account
router.post("/create", createUser);

// GENERAL AUTH: Any logged-in user can fetch their own profile data
router.get("/profile", requireUser, getUserProfile);

router.get("/faculties", requireUser, getFaculties);
router.put("/profile", requireUser, updateUserProfile);

export default router;