import { ZodError } from 'zod';
export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
        requestId: req.requestId,
    });
}
export function errorHandler(err, req, res, _next) {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request payload',
                issues: err.issues.map((i) => ({ path: i.path, message: i.message })),
            },
            requestId: req.requestId,
        });
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: { code: err.code, message: err.message },
            requestId: req.requestId,
        });
        return;
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[${req.requestId ?? '-'}] Unhandled error:`, err);
    res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        requestId: req.requestId,
        ...(process.env.NODE_ENV !== 'production' ? { detail: message } : {}),
    });
}
