import mongoose, { Schema, Document } from "mongoose";
//Declares a TypeScript interface IUser that extends Mongoose’s Document.
//This says a IUser object has name, email, password (all strings) plus all Document members (e.g. _id, .save()).
const userSchema = new Schema({
    //new Schema<IUser>(...) helps TypeScript match schema fields with the IUser type for better typing in your code
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });
export const User = mongoose.model("User", userSchema);
//# sourceMappingURL=userModel.js.map