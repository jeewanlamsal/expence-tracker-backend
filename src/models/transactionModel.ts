import mongoose, { Schema, Document} from "mongoose";

export interface ITransaction extends Document {
    //interface is a typescript features that describes the structure (properties and types) that and object should have.
    // so here ITransaction decribes what fields each transaction document in mongodb will contain.
    //so it is saying that "“ITransaction includes all the standard Mongoose document fields and methods (like _id, .save(), .remove(), etc.) — plus my own custom fields.”"
    
    userId: mongoose.Schema.Types.ObjectId;
    title: String;
    amount: number;
    type:"income"| "expense";
    //type can only have two values  income and expense
    category: string;
    date: Date;
}

const transactionSchema= new Schema<ITransaction>({
    //The Schema<ITransaction> ensures the schema structure matches your TypeScript interface as described above.
    userId: { type: Schema.Types.ObjectId, ref:"User", required: true},
    title: {type:String, required: true},
    amount: {type:Number, required:true},
    type: {type:String, enum:["income", "expense"], required:true},
    //Only allows `"income"` or `"expense"`; anything else throws a validation error
    category: {type: String},
    date:{ type: Date, default: Date.now},
},
{timestamps:true}); //add created or updated filed

export const Transaction=mongoose.model<ITransaction>(
    "Transaction",
    transactionSchema
);