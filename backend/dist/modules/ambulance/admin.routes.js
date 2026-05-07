import { Router } from 'express';
import { adminActionLimiter, authGuard, roleGuard, validateRequest, } from '../../shared/middleware/index.js';
import { approveBodySchema, assignBodySchema, availableUnitsQuerySchema, idParamSchema, listAdminQuerySchema, rejectBodySchema, } from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';
const router = Router();
router.use(authGuard, roleGuard('admin'), adminActionLimiter);
function ctx(req) {
    return {
        io: req.app.get('io'),
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
router.get('/', validateRequest({ query: listAdminQuerySchema }), async (req, res, next) => {
    try {
        const data = await svc.listAdmin(req.validated.query);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/units/available', validateRequest({ query: availableUnitsQuerySchema }), async (req, res, next) => {
    try {
        const data = await svc.getAvailableUnitsForAdmin(req.validated.query);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', validateRequest({ params: idParamSchema }), async (req, res, next) => {
    try {
        const data = await svc.getOne(req.validated.params.id, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/approve', validateRequest({ params: idParamSchema, body: approveBodySchema }), async (req, res, next) => {
    try {
        const { notes } = req.validated.body;
        const data = await svc.approve(req.validated.params.id, notes, req.auth, ctx(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/reject', validateRequest({ params: idParamSchema, body: rejectBodySchema }), async (req, res, next) => {
    try {
        const { reason } = req.validated.body;
        const data = await svc.reject(req.validated.params.id, reason, req.auth, ctx(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/assign', validateRequest({ params: idParamSchema, body: assignBodySchema }), async (req, res, next) => {
    try {
        const data = await svc.assign(req.validated.params.id, req.validated.body, req.auth, ctx(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
export default router;
