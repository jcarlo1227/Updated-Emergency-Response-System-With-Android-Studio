import { Router } from 'express';
import { authGuard, emergencyCreateLimiter, validateRequest, } from '../../shared/middleware/index.js';
import { assignBodySchema, cancelBodySchema, createEmergencySchema, idParamSchema, listActiveQuerySchema, listMineQuerySchema, onTheWayBodySchema, reportBodySchema, } from './emergencies.schemas.js';
import * as svc from './emergencies.service.js';
const router = Router();
router.use(authGuard);
function ctxFrom(req) {
    const io = req.app.get('io');
    return {
        io,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
router.post('/', emergencyCreateLimiter, validateRequest({ body: createEmergencySchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const data = await svc.createEmergency(input, req.auth, ctxFrom(req));
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/active', validateRequest({ query: listActiveQuerySchema }), async (req, res, next) => {
    try {
        const q = req.validated.query;
        const data = await svc.listActive(q, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/my', validateRequest({ query: listMineQuerySchema }), async (req, res, next) => {
    try {
        const q = req.validated.query;
        const data = await svc.listMine(q, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', validateRequest({ params: idParamSchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const data = await svc.getOne(id, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/cancel', validateRequest({ params: idParamSchema, body: cancelBodySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const body = req.validated.body;
        const data = await svc.cancel(id, body, req.auth, ctxFrom(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/assign', validateRequest({ params: idParamSchema, body: assignBodySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const body = req.validated.body;
        const data = await svc.assign(id, body, req.auth, ctxFrom(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/on-the-way', validateRequest({ params: idParamSchema, body: onTheWayBodySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const data = await svc.setOnTheWay(id, req.auth, ctxFrom(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/report', validateRequest({ params: idParamSchema, body: reportBodySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const body = req.validated.body;
        const data = await svc.report(id, body, req.auth, ctxFrom(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
export default router;
