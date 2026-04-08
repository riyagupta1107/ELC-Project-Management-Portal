// //src/middleware/authMiddleWare.js
// import User from "../models/User.js";

// export const requireUser = async (req,res,next) => {
//     const firebaseUid = req.headers["x-firebase-uid"];

//     if (!firebaseUid) {
//         return res.status(401).json({ message: "Unauthorized" });
//     }

//     const user = await User.findOne({firebaseUid});
//     if (!user) {
//         return res.status(401).json({ message: "User not found!" });
//     }

//     req.user = user;
//     next();
// };


// src/middleware/authMiddleWare.js
import admin from "../config/firebase-admin.js"; // Adjust path to your firebase admin config
import User from "../models/User.js";

export const requireUser = async (req, res, next) => {
    // 1. Extract Bearer token instead of raw UID
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // 2. Securely verify the token with Firebase
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        // 3. Find user
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(401).json({ message: "User not found!" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};