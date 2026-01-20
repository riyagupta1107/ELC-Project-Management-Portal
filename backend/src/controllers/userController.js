import User from "../models/User.js";

export const createUser = async(req, res) => {
    try {
        const {firebaseUid, email, role, name} = req.body;

        if (!firebaseUid || !email || !role || !name) {
            return res.status(400).json({ message: "Missing fields" });
        }

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid, email, role, name,
            });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "User Creation failed" });
    }
};