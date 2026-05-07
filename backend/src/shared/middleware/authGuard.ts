import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from './errorHandler.js';
import type { AuthContext, AuthRole } from '../types/http.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AuthRole;
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sub === 'string' &&
    typeof v.email === 'string' &&
    (v.role === 'user' || v.role === 'responder' || v.role === 'admin')
  );
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Missing or malformed Authorization header', 401, 'UNAUTHENTICATED'));
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Empty bearer token', 401, 'UNAUTHENTICATED'));
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!isAccessTokenPayload(decoded)) {
      next(new AppError('Invalid token payload', 401, 'UNAUTHENTICATED'));
      return;
    }
    const auth: AuthContext = {
      accountId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    req.auth = auth;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHENTICATED'));
  }
}
