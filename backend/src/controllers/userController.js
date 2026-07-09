// src/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/users/register
export const createUser = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone } = req.body;

        if (!password || !email || !role || !firstName || !lastName) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Security check: Ensure roles are strictly controlled and uppercase
        const allowedRoles = ["STUDENT", "FACULTY"];
        const normalizedRole = role.toUpperCase().trim();
        
        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        // Check if user already exists by email
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create a new user with hashed password
        const user = await User.create({ 
            email, 
            password: hashedPassword,
            role: normalizedRole, 
            firstName, 
            lastName,
            phone,
        });
        
        // FIX: Return the JWT token so the frontend can log them in immediately
        return res.status(201).json({ 
            message: "User created successfully", 
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error("Error in createUser:", error);
        return res.status(500).json({ message: "User Creation failed", error: error.message });
    }
};

// @desc    Authenticate a user & get token
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Check if user exists and password matches the hashed password in DB
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
};

// @desc    Get all faculties for the directory
// @route   GET /api/users/faculties
export const getFaculties = async (req, res) => {
    try {
        const faculties = await User.find({ role: "FACULTY" })
            .select('firstName lastName email') 
            .sort({ firstName: 1 }); // Sort alphabetically

        res.status(200).json(faculties);
    } catch (error) {
        console.error("Error fetching faculties:", error);
        res.status(500).json({ message: "Failed to fetch faculty directory" });
    }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
    try {
        // FIX: Find the user by their MongoDB _id attached by the authMiddleware
        const userId = req.user._id;
        
        const { firstName, lastName, phone, bio, resumeLink } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, phone, bio, resumeLink },
            { new: true, runValidators: true } // 'new: true' is the mongoose equivalent to returnDocument: 'after'
        ).select('-password'); // Exclude password from the response

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
};