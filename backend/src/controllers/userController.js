// src/controllers/userController.js
import User from "../models/User.js";

export const createUser = async (req, res) => {
    try {
        const { firebaseUid, email, role, firstName, lastName, phone } = req.body;

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
            phone,
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

// Get all faculties for the directory
export const getFaculties = async (req, res) => {
    try {
        // Find all users with the FACULTY role, but exclude sensitive info if you had any
        const faculties = await User.find({ role: "FACULTY" })
            .select('firstName lastName email') 
            .sort({ firstName: 1 }); // Sort alphabetically

        res.status(200).json(faculties);
    } catch (error) {
        console.error("Error fetching faculties:", error);
        res.status(500).json({ message: "Failed to fetch faculty directory" });
    }
};

// Update user profile details
export const updateUserProfile = async (req, res) => {
    try {
        const firebaseUid = req.user.firebaseUid;
        // Extract the fields the user is allowed to change
        const { firstName, lastName, phone, bio, resumeLink } = req.body;

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid },
            { firstName, lastName, phone, bio, resumeLink },
            { returnDocument: 'after' } // Returns the newly updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
};