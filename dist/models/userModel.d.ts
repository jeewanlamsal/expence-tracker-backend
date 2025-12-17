import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    name: String;
    email: String;
    password: String;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=userModel.d.ts.map