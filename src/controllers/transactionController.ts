import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/transactionModel.js";

interface AuthenticatedRequest extends Request {
  // If you globally augmented express.Request you can use Request directly.
  //you`re creating a new interface that inherits all properties from express request like req.body, req.params
  user?: { _id?: string } | mongoose.Types.ObjectId | any;
  /**user: You are adding a new pocket named "user" to the backpack.

? (The Question Mark): This means Optional.
Why? Not every request in your app will be from a logged-in user. Sometimes a user is just visiting the homepage (public).
If you didn't put the ?, TypeScript would force you to always have a user attached, which would break your public pages.
It tells the code: "There might be a user here, or it might be undefined. Be prepared for both." */
  // the question mark ? means the property is optional 
  // |any this last fallback makes typescript accept anything.
}
/**This is a great snippet to focus on! You are looking at a specific TypeScript feature called Type Extension.
In the previous parts (Middleware and Controller), we used req.user. But here is the problem: Standard Express Requests do not know what a "user" is. If you try to type req.user in a standard TypeScript file,
 the compiler will yell at you: "Error: Property 'user' does not exist on type 'Request'."
This code is you telling TypeScript: "Relax, I know what I'm doing. I'm making a custom version of the Request that DOES have a user." */

/**
 * POST /api/transactions
 */
export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, amount, type, category, date } = req.body as {
      title: string;
      amount: number;
      type: "income" | "expense";
      category?: string; //? means optional
      date?: string | Date;
    };

    if (!title || amount == null || !type) {
      return res.status(400).json({ message: "title, amount and type are required" });
    }

    const transaction = await Transaction.create({
      userId: req.user?._id || req.user,
      //associates the transaction with the authenticated user.
      //supportd cases where req.user is an object {_id.string} or a raw objectid
      title,
      amount: Number(amount),
      type,
      category,
      date: date ? new Date(date) : undefined,
      //if a date is provided, convert it to a date otherwise mongoose will use default date.now.
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error("createTransaction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/transactions
 * Supports pagination and simple filters: ?page=1&limit=20&type=expense&category=Food&startDate=2025-01-01&endDate=2025-01-31
 */
export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user;
    //ensures we only fetch transactions from the logged-in users
    const { page = "1", limit = "20", startDate, endDate, category, type } = req.query as any;


    const pageNum = Math.max(1, parseInt(page, 10));
    //converts the query strings to numbers.
    const lim = Math.max(1, parseInt(limit, 10));
    //ensures page and limit are at least 1 (prevents invalid queries).
    /**req.query: This reads the part of the URL after the ?. For example, in /api/transactions?page=2, the query is { page: '2' }.
page = "1" / limit = "20": These set default values. If the user doesn't specify a page or limit, we assume they want page 1 and 20 items per page.
parseInt(page, 10): Converts the text string ("2") from the URL into a proper number (2) so we can do math with it.
Math.max(1, ...): This is a guardrail. If a mischievous user tries to set page=0 or limit=0, we force the value to be at least 1. */

    const filter: any = { userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    /**const filter: any = { userId }: Every single search starts with this condition. You must be the owner of the transaction.
if (type) filter.type = type;: If the user asked for ?type=expense, the filter object becomes { userId: ..., type: 'expense' }.
Date Filtering (The $gte and $lte):
MongoDB uses special syntax ($gte, $lte) for range queries.
$gte stands for Greater Than or Equal to (the start date).
$lte stands for Less Than or Equal to (the end date).
new Date(startDate): Converts the date string (like "2025-01-01") into a format the database can understand. */
    //construct a dynamic filter object for mongodb

    const total = await Transaction.countDocuments(filter);
    /**We ask the database: "How many records match this filter in total?" This count (total) is needed to calculate the number of pages later. */
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip((pageNum - 1) * lim)
      .limit(lim)
      .lean();
      //This is a single, chained command that handles the Pagination.
      /**.find(filter): Fetch all documents matching the user's criteria (user ID, category, date, etc.).
.sort({ date: -1 }): Organize the results. -1 means descending, so the newest transactions come first.
.skip((pageNum - 1) * lim): This performs the pagination jump. 
If you are on page 3 and the limit is 10, you skip (3 - 1) * 10 = 20 transactions to get to the start of page 3.
.limit(lim): After skipping, only fetch the maximum number of items per page (e.g., 20).
.lean(): A performance optimization. It tells Mongoose to return simple, 
lightweight JavaScript objects instead of complex Mongoose objects. This is faster when you only need to read the data. */
 /*Transaction.find(filter) → fetch documents that match the filter.
.sort({ date: -1 }) → newest transactions first.
.skip((pageNum - 1) * lim) → skip previous pages.
.limit(lim) → fetch only the page size.
.lean() → returns plain JS objects instead of Mongoose documents (better performance for read-only operations). */
/** */

    return res.json({ transactions, total, page: pageNum, pages: Math.ceil(total / lim) });
    /**Math.ceil(total / lim): This calculates the total number of pages needed. Math.ceil() rounds up to the next whole number (e.g., if there are 21 transactions and the limit is 20, you need 2 pages).
The function sends back an object containing:
transactions: The list of 20 items for the current page.
total: The full count of matching transactions (needed for the frontend to show "Showing 1-20 of 105 results").
page: The current page number.
pages: The total number of pages available.
This structure allows the frontend to draw the transaction list and the pagination buttons accurately. */
  } catch (error) {
    console.error("getTransactions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/*transactions: array of transactions for this page
total: total matching transactions
page: current page number
pages: total number of pages (calculated with Math.ceil(total / limit)) */


/**
 * GET /api/transactions/:id
 */
export const getTransactionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    /**req.params.id comes from the URL (e.g., /api/transactions/64db123abc...).
mongoose.isValidObjectId(id) checks if the ID is a valid MongoDB ObjectId.
If invalid → return 400 Bad Request. */

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // ownership check
    const ownerId = transaction.userId?.toString();
    const requesterId = (req.user?._id || req.user)?.toString();
    if (ownerId !== requesterId) return res.status(403).json({ message: "Not authorized" });
  /**Ensures the logged-in user owns this transaction.

transaction.userId → the owner of the transaction.
req.user?._id || req.user → authenticated user ID from JWT middleware.
Convert both to strings for comparison.
If IDs do not match → return 403 Forbidden.
Why: Prevents a user from accessing someone else’s transactions. */  

    return res.json(transaction);
  } catch (error) {
    console.error("getTransactionById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/transactions/:id
 */
export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    /**Extracts the id from the request URL (like /api/transactions/6710abc123).
Uses mongoose.isValidObjectId() to ensure the provided ID is a valid MongoDB ObjectId.
If invalid, sends back a 400 Bad Request response immediately.
✅ Why: prevents unnecessary DB calls and crashes from malformed IDs. */

    const existing = await Transaction.findById(id);
    if (!existing) return res.status(404).json({ message: "Transaction not found" });
//Looks up the transaction document in MongoDB by its _id.
    const ownerId = existing.userId?.toString();
    const requesterId = (req.user?._id || req.user)?.toString();
    if (ownerId !== requesterId) return res.status(403).json({ message: "Not authorized" });
/**Compares the user who owns the transaction (existing.userId)
with the user making the request (req.user).
.toString() is used because MongoDB ObjectIds need to be converted to strings before comparison.
If they don’t match → 403 Forbidden.
✅ Why: This is crucial for security.
It ensures that a user can only update their own transactions, not anyone else’s. */
    const updates = req.body;
    const updated = await Transaction.findByIdAndUpdate(id, updates, { new: true }).lean();
    return res.json(updated);
    /**req.body contains the fields the user wants to update (e.g., { amount: 200, title: "New Title" }).

Transaction.findByIdAndUpdate() does two things:
Finds the document by its _id.
Updates it with the given data.
The { new: true } option tells Mongoose to return the updated document, not the old one.
.lean() converts it into a plain JavaScript object (faster for reading and sending as JSON).
✅ Why: Efficiently updates the record and responds with the new version of the transaction. */
  } catch (error) {
    console.error("updateTransaction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const ownerId = transaction.userId?.toString();
    const requesterId = (req.user?._id || req.user)?.toString();
    if (ownerId !== requesterId) return res.status(403).json({ message: "Not authorized" });

    await transaction.deleteOne();
    return res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("deleteTransaction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/transactions/summary
 * Returns:
 *  - last 6 months aggregated income/expense per month
 *  - category totals
 *  - total income & total expense
 */
export const getSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?._id || req.user);
/**Converts the authenticated user’s ID (from JWT) into a mongoose.ObjectId, which is needed for MongoDB aggregation queries.
Ensures the user’s data is isolated — each user only sees their own summary. */
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setHours(0, 0, 0, 0);
    /**Creates a startDate representing 6 months ago from now.
Used to limit data to the last 6 months for monthly summaries.
✅ Example:
If today is October 2025,
startDate will be April 1, 2025, 00:00:00. */

    // monthly income/expense for last 6 months
    const monthly = await Transaction.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      {
        $project: {
          amount: 1,
          type: 1,
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    /**$match
Filters only the current user’s transactions since startDate.
🔹 $project
Creates new fields:
year = the year of the transaction
month = the month of the transaction
Keeps amount and type fields
🔹 $group
Groups by year and month:
Calculates total income and expense for each month using $cond (conditional sum). */

    // category totals (top 10)
    const category = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
    /**$match: Only the user’s transactions.
$group: Groups by category field and sums all amounts.
$sort: Sorts descending (-1) by total.
$limit: Keeps only the top 10 categories. */

    // total income & expense
    const totals = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);
    /**Groups all the user’s transactions by type (income or expense).
Calculates the total amount for each. */

    const totalIncome = totals.find((t) => t._id === "income")?.total || 0;
    const totalExpense = totals.find((t) => t._id === "expense")?.total || 0;
//Ensures even if a user has only expenses or only incomes, the missing one defaults to 0.
    return res.json({ monthly, category, totalIncome, totalExpense });
  } catch (error) {
    console.error("getSummary error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get monthly and category analytics
// @route   GET /api/transactions/analytics
// @access  Private
export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    // Monthly summary
    const monthly: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleString("default", { month: "short" });
      if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
      monthly[month][t.type] += t.amount;
    });

    // Category summary
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
    if (t.type === "expense") {
  const cat = t.category || "Uncategorized";
  categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
}

    });

    res.json({ monthly, categoryTotals });
  } catch (error) {
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
