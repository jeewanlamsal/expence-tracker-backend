import mongoose from "mongoose";
import { Transaction } from "../models/transactionModel.js";
/**
 * POST /api/transactions
 */
export const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;
        if (!title || amount == null || !type) {
            return res.status(400).json({ message: "title, amount and type are required" });
        }
        const transaction = await Transaction.create({
            userId: req.user?._id || req.user,
            title,
            amount: Number(amount),
            type,
            category,
            date: date ? new Date(date) : undefined,
        });
        return res.status(201).json(transaction);
    }
    catch (error) {
        console.error("createTransaction error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
/**
 * GET /api/transactions
 * Supports pagination and simple filters: ?page=1&limit=20&type=expense&category=Food&startDate=2025-01-01&endDate=2025-01-31
 */
export const getTransactions = async (req, res) => {
    try {
        const userId = req.user?._id || req.user;
        const { page = "1", limit = "20", startDate, endDate, category, type } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const lim = Math.max(1, parseInt(limit, 10));
        const filter = { userId };
        if (type)
            filter.type = type;
        if (category)
            filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const total = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .skip((pageNum - 1) * lim)
            .limit(lim)
            .lean();
        return res.json({ transactions, total, page: pageNum, pages: Math.ceil(total / lim) });
    }
    catch (error) {
        console.error("getTransactions error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
/**
 * GET /api/transactions/:id
 */
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id))
            return res.status(400).json({ message: "Invalid id" });
        const transaction = await Transaction.findById(id);
        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });
        // ownership check
        const ownerId = transaction.userId?.toString();
        const requesterId = (req.user?._id || req.user)?.toString();
        if (ownerId !== requesterId)
            return res.status(403).json({ message: "Not authorized" });
        return res.json(transaction);
    }
    catch (error) {
        console.error("getTransactionById error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
/**
 * PUT /api/transactions/:id
 */
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id))
            return res.status(400).json({ message: "Invalid id" });
        const existing = await Transaction.findById(id);
        if (!existing)
            return res.status(404).json({ message: "Transaction not found" });
        const ownerId = existing.userId?.toString();
        const requesterId = (req.user?._id || req.user)?.toString();
        if (ownerId !== requesterId)
            return res.status(403).json({ message: "Not authorized" });
        const updates = req.body;
        const updated = await Transaction.findByIdAndUpdate(id, updates, { new: true }).lean();
        return res.json(updated);
    }
    catch (error) {
        console.error("updateTransaction error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
/**
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id))
            return res.status(400).json({ message: "Invalid id" });
        const transaction = await Transaction.findById(id);
        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });
        const ownerId = transaction.userId?.toString();
        const requesterId = (req.user?._id || req.user)?.toString();
        if (ownerId !== requesterId)
            return res.status(403).json({ message: "Not authorized" });
        await transaction.deleteOne();
        return res.json({ message: "Transaction deleted" });
    }
    catch (error) {
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
export const getSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?._id || req.user);
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 5);
        startDate.setHours(0, 0, 0, 0);
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
        // category totals (top 10)
        const category = await Transaction.aggregate([
            { $match: { userId } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 10 },
        ]);
        // total income & expense
        const totals = await Transaction.aggregate([
            { $match: { userId } },
            { $group: { _id: "$type", total: { $sum: "$amount" } } },
        ]);
        const totalIncome = totals.find((t) => t._id === "income")?.total || 0;
        const totalExpense = totals.find((t) => t._id === "expense")?.total || 0;
        return res.json({ monthly, category, totalIncome, totalExpense });
    }
    catch (error) {
        console.error("getSummary error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
//# sourceMappingURL=transactionController.js.map