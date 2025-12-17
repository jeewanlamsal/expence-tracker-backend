import mongoose, { Schema, Document} from "mongoose";
// Imports Mongoose. Schema is the Mongoose Schema class you use to define the shape of documents. Document is a TypeScript type describing a Mongoose document instance (it includes runtime fields/methods like _id, save(), etc.).
// Note: the import mongoose default import works if your tsconfig.json allows esModuleInterop: true (or allowSyntheticDefaultImports: true). Otherwise use import * as mongoose from 'mongoose' or import model/Schema directly.

export interface IUser extends Document{
    name: String;
    email: String;
    password: String;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
//Declares a TypeScript interface IUser that extends Mongoose’s Document.
//This says a IUser object has name, email, password (all strings) plus all Document members (e.g. _id, .save()).

const userSchema= new Schema<IUser>({
    //new Schema<IUser>(...) helps TypeScript match schema fields with the IUser type for better typing in your code
    name: {type: String, required: true},
    email: { type: String, required: true, unique:true},
    password: {type: String, required: true},
},
{timestamps:true});

export const User= mongoose.model<IUser>("User",userSchema);