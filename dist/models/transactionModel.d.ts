import mongoose, { Document } from "mongoose";
export interface ITransaction extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    title: String;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: Date;
}
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=transactionModel.d.ts.map