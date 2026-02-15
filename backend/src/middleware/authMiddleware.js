//src/middleware/authMiddleWare.js
import User from "../models/User.js";

export const requireUser = async (req,res,next) => {
    const firebaseUid = req.headers["x-firebase-uid"];

    if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({firebaseUid});
    if (!user) {
        return res.status(401).json({ message: "User not found!" });
    }

    req.user = user;
    next();
};