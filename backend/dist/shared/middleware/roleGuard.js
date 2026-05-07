import { AppError } from './errorHandler.js';
export function roleGuard(...allowed) {
    return (req, _res, next) => {
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
