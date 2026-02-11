import User from "../models/User.js";

export const createUser = async(req, res) => {
    try {
        const {firebaseUid, email, role, firstName, lastName} = req.body;

        if (!firebaseUid || !email || !role?.trim() || !firstName || !lastName) {
            return res.status(400).json({ message: "Missing fields" });
        }

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid, email, role, firstName, lastName,
            });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "User Creation failed" });
    }
};

export const getUserProfile = async(req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};