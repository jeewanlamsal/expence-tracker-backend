import type { Request, Response, NextFunction } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
}
export declare const protect: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=authMiddleware.d.ts.map