import { Router } from 'express';
import { z } from 'zod';
import { authGuard, roleGuard, validateRequest, } from '../../shared/middleware/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import * as svc from './notifications.service.js';
const router = Router();
router.use(authGuard, roleGuard('admin'));
const listQuerySchema = z.object({
    status: z.enum(['unread', 'read', 'acknowledged', 'all']).default('all'),
    type: z.enum(['emergency', 'ambulance', 'system', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
router.get('/', validateRequest({ query: listQuerySchema }), async (req, res, next) => {
    try {
        const q = req.validated.query;
        const data = await svc.listForAdmin(q);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
const idParamSchema = z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});
router.patch('/:id/ack', validateRequest({ params: idParamSchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const data = await svc.acknowledge(id, req.auth.accountId);
        if (!data) {
            throw new AppError('Notification not found', 404, 'NOT_FOUND');
        }
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/mark-all-read', async (req, res, next) => {
    try {
        await svc.markAllRead(req.auth.accountId);
        res.json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
export default router;
