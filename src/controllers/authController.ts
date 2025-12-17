import type { Request } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import type { IUser } from "../models/userModel.js";

// Helper: Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || " ", {
    //It is used to create (sign) a token that can later be verified by the server to authenticate a user.

    expiresIn: "30d",
  });
};
/**const generateToken: This is a mini-machine inside your code. You give it a User ID, and it spits out a long, encrypted string (the Token).
jwt.sign: The command to "write" the digital signature.
{ id }: We are hiding the User's ID inside the token.
process.env.JWT_SECRET: This is the stamp that proves the token is real.
expiresIn: "30d": This is a security feature. Like a gym pass that expires, this token will stop working after 30 days, forcing the user to log in again. */
//when users tries to login serever verifies credentials and generate tokens.
//and send jwt sting to frontend so that frontend can store it and send requests in future.

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  //extracts submitted fields from the request body.

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    /**bcrypt: The security tool used to scramble passwords.
genSalt(10): Imagine taking a clean password and throwing a handful of random sand ("salt") into it.
 This ensures that even if two users have the same password (e.g., "123456"), their stored "hash" will look completely different.
hash(password, salt): This effectively puts the password and the salt into a blender. The result (hashedPassword) is a gibberish string that cannot be turned back into the original password. */
   // salting generates unique and random password  before hashing to create unique hash to prevent rainbow attack.
   //a rainbow table is a large, precomputed table that contains millions of possible passwords and their corresponding hash values.
    const user: IUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken((user._id as string).toString()),
        /**token: generateToken(...): We immediately run our helper function. 
         * This means as soon as you sign up, you are automatically logged in and get your digital ID card. */
        //create a jwt you can sends to the client.
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }) as IUser;
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password.toString());
    //verifies the supplied password against stored hash and if match retrun user info +jwt
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    /**bcrypt.compare: This function is magic. It takes the real password the user just typed, 
     * adds the same "salt" used before, blends it, and checks if the result matches the stored mess in the database.
Why generic messages? Notice we say "Invalid credentials" for both email failure and password failure. 
This is for security—we don't want to tell hackers which part they got right. */

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken((user._id as string).toString()),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
    /**req.user._id: Remember the middleware code? It stuck the user object onto req. Here, we just grab that ID.
.select("-password"): Even though the user is already logged in, when we send their profile data to the screen,
 we exclude the hashed password. There is no reason the frontend needs to see that. */
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
