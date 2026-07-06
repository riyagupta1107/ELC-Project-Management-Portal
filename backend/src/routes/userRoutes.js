import express from "express";
import { 
    createUser, 
    loginUser, 
    getUserProfile, 
    getFaculties, 
    updateUserProfile 
} from "../controllers/userController.js";
import { requireUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. PUBLIC AUTH ROUTES
// These must match exactly what AuthContext.jsx is calling
router.post("/register", createUser);
router.post("/login", loginUser);

// 2. PROTECTED PROFILE ROUTES
// Any logged-in user can fetch or update their own profile data
router.get("/profile", requireUser, getUserProfile);
router.put("/profile", requireUser, updateUserProfile);

// 3. PUBLIC DIRECTORY ROUTE (Requires login, but not a specific role)
// Students need to be able to fetch the list of faculties, so do not restrict to FACULTY only
router.get("/faculties", requireUser, getFaculties);

export default router;