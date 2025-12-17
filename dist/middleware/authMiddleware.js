import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js"; // assuming it's exported properly
import mongoose from "mongoose";
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Not authorized, token missing" });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
            if (typeof decoded === "object" &&
                decoded !== null &&
                "id" in decoded) {
                const tokenData = decoded;
                // Fetch user and remove password
                req.user = await User.findById(tokenData.id).select("-password");
            }
            else {
                return res.status(401).json({ message: "Invalid token payload" });
            }
            if (!req.user) {
                return res.status(401).json({ message: "User not found" });
            }
            next();
        }
        catch (error) {
            console.error("JWT verification failed:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }
    else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
//# sourceMappingURL=authMiddleware.js.map