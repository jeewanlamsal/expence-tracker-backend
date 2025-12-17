import type { Request, Response } from "express";
import mongoose from "mongoose";
interface AuthenticatedRequest extends Request {
    user?: {
        _id?: string;
    } | mongoose.Types.ObjectId | any;
}
/**
 * POST /api/transactions
 */
export declare const createTransaction: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/transactions
 * Supports pagination and simple filters: ?page=1&limit=20&type=expense&category=Food&startDate=2025-01-01&endDate=2025-01-31
 */
export declare const getTransactions: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/transactions/:id
 */
export declare const getTransactionById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/transactions/:id
 */
export declare const updateTransaction: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/transactions/:id
 */
export declare const deleteTransaction: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/transactions/summary
 * Returns:
 *  - last 6 months aggregated income/expense per month
 *  - category totals
 *  - total income & total expense
 */
export declare const getSummary: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=transactionController.d.ts.map