import { Router } from 'express';
import { authGuard, roleGuard, validateRequest, ambulanceRequestLimiter, ambulanceAvailabilityLimiter, } from '../../shared/middleware/index.js';
import { availabilityQuerySchema, cancelBodySchema, createAmbulanceRequestSchema, idParamSchema, listMineQuerySchema, } from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';
const router = Router();
router.use(authGuard, roleGuard('user'));
function ctx(req) {
    return {
        io: req.app.get('io'),
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
router.post('/', ambulanceRequestLimiter, validateRequest({ body: createAmbulanceRequestSchema }), async (req, res, next) => {
    try {
        const data = await svc.createRequest(req.validated.body, req.auth, ctx(req));
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/my', validateRequest({ query: listMineQuerySchema }), async (req, res, next) => {
    try {
        const data = await svc.listMine(req.validated.query, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
router.get('/availability', ambulanceAvailabilityLimiter, validateRequest({ query: availabilityQuerySchema }), async (req, res, next) => {
    try {
        const data = await svc.checkAvailability(req.validated.query);
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
router.post('/:id/cancel', validateRequest({ params: idParamSchema, body: cancelBodySchema }), async (req, res, next) => {
    try {
        const data = await svc.cancel(req.validated.params.id, req.validated.body, req.auth, ctx(req));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
export default router;
