import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { User } from "../models/userModel.js"; // assuming it's exported properly
import mongoose from "mongoose";

interface DecodedToken extends JwtPayload {
  id: mongoose.Types.ObjectId;
}
/**Defines what a decoded JWT looks like in your app.
It extends JwtPayload and adds an extra property: id.
This means your token is expected to contain an object like { id: someObjectId } */

interface AuthenticatedRequest extends Request {
  user?: any; // or create an IUser interface if you have it defined
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
    /**req.headers.authorization: When a frontend (like a React app) sends a request, 
     * it usually puts the secret token in the "Header" (like the outside of an envelope). It looks like this: Authorization: Bearer abc123xyz...
startsWith("Bearer"): This checks if the header follows the standard rule.
 "Bearer" is just a convention; it means "The person bearing (holding) this token is the owner." */
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      /**try: We are attempting something risky. If it crashes, we catch the error later.
split(" ")[1]: The header string looks like "Bearer <token>".
We split it by the space.
Item [0] is "Bearer".
Item [1] is the actual token code. We grab item [1]. */
      if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
      }
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as unknown;
      /**jwt.verify: This is the scanner machine. It checks two things:
Is the token expired?
Was this token signed by US?
process.env.JWT_SECRET: This is a secret password (like a digital signature) stored on your server. Only your server knows it.
 If a hacker tries to make a fake token, they won't have this secret, so verify will fail. */

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "id" in decoded
      ) {
        const tokenData = decoded as DecodedToken;
        // Fetch user and remove password
        req.user = await User.findById(tokenData.id).select("-password");
        /**tokenData.id: We grab the User ID from the token.
User.findById(...): We ask the database: "Hey, do you have a user with this ID?"
await: The code pauses here until the database answers.
.select("-password"): This is crucial! We fetch the user's name, email, etc., but the - (minus sign) tells the database: "Do NOT send me the password." 
We don't want the password floating around in memory for security reasons.
req.user = ...: We stick the user's details onto the req object.
 Now, the next function in your app knows exactly who is making the request! */
      } else {
        return res.status(401).json({ message: "Invalid token payload" });
      }
      /**This block is pure safety. We verified the token, but we need to make sure the data inside it isn't garbage.
       *  We check: "Is it an object? Is it not null? Does it actually have an id inside?" */

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("JWT verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
