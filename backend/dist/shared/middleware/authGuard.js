import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from './errorHandler.js';
function isAccessTokenPayload(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const v = value;
    return (typeof v.sub === 'string' &&
        typeof v.email === 'string' &&
        (v.role === 'user' || v.role === 'responder' || v.role === 'admin'));
}
export function authGuard(req, _res, next) {
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
        const auth = {
            accountId: decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
        req.auth = auth;
        next();
    }
    catch {
        next(new AppError('Invalid or expired token', 401, 'UNAUTHENTICATED'));
    }
}
