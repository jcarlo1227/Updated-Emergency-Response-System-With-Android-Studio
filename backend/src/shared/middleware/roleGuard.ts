import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from './errorHandler.js';
import type { AuthRole } from '../types/http.js';

export function roleGuard(...allowed: AuthRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      next(new AppError('Forbidden for this role', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
