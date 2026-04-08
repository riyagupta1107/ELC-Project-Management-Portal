// src/controllers/userController.js
import User from "../models/User.js";

export const createUser = async (req, res) => {
    try {
        const { firebaseUid, email, role, firstName, lastName } = req.body;

        if (!firebaseUid || !email || !role || !firstName || !lastName) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Security check: Ensure roles are strictly controlled and uppercase
        const allowedRoles = ["STUDENT", "FACULTY"];
        const normalizedRole = role.toUpperCase().trim();
        
        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        let user = await User.findOne({ firebaseUid });

        // If user already exists, just return them
        if (user) {
            return res.status(200).json({ message: "User already exists", user });
        }

        // If user doesn't exist, create a new one with the uppercase role
        user = await User.create({
            firebaseUid, 
            email, 
            role: normalizedRole, 
            firstName, 
            lastName,
        });
        
        return res.status(201).json({ message: "User created successfully", user });

    } catch (error) {
        console.error("Error in createUser:", error);
        return res.status(500).json({ message: "User Creation failed", error: error.message });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
};