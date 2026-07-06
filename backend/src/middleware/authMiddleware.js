import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Verify the token signature using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);        
        
        // 2. Find user in the database (excluding the password field for security)
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "User not found!" });
        }

        // 3. Attach user to the request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};