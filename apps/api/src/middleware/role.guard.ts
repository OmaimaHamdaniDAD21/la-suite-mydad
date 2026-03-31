import { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler";
import type { Role } from "@mydad/shared";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }
    next();
  };
}
