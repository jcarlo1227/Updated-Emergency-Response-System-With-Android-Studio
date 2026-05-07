import { Router } from 'express';
import { adminActionLimiter, authGuard, roleGuard, validateRequest, } from '../../shared/middleware/index.js';
import { idParamSchema, resolveBodySchema, } from './emergencies.schemas.js';
import * as svc from './emergencies.service.js';
const router = Router();
router.use(authGuard, roleGuard('admin'));
router.post('/:id/resolve', adminActionLimiter, validateRequest({ params: idParamSchema, body: resolveBodySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const body = req.validated.body;
        const io = req.app.get('io');
        const data = await svc.resolve(id, body, req.auth, {
            io,
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.header('user-agent') ?? undefined,
        });
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
export default router;
