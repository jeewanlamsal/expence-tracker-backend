import mongoose, { Schema, Document } from "mongoose";
const transactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    //Only allows `"income"` or `"expense"`; anything else throws a validation error
    category: { type: String },
    date: { type: Date, default: Date.now },
}, { timestamps: true });
export const Transaction = mongoose.model("Transaction", transactionSchema);
//# sourceMappingURL=transactionModel.js.map