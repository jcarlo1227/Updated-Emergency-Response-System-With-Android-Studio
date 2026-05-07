import { Router } from 'express';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import { idParamSchema, responderUpdateBodySchema, } from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';
const router = Router();
router.use(authGuard, roleGuard('responder'));
function buildCtx(req) {
    return {
        io: req.app.get('io'),
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
function makeHandler(fn) {
    return async (req, res, next) => {
        try {
            const { id } = req.validated.params;
            const body = req.validated.body;
            const data = await fn(id, body, req.auth, buildCtx(req));
            res.json({ data });
        }
        catch (err) {
            next(err);
        }
    };
}
router.get('/', async (req, res, next) => {
    try {
        const data = await svc.listResponderAssigned(req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
const validate = validateRequest({
    params: idParamSchema,
    body: responderUpdateBodySchema,
});
router.post('/:id/on-the-way', validate, makeHandler(svc.setOnTheWay));
router.post('/:id/arrived-pickup', validate, makeHandler(svc.setArrivedPickup));
router.post('/:id/patient-onboard', validate, makeHandler(svc.setPatientOnboard));
router.post('/:id/complete', validate, makeHandler(svc.complete));
export default router;
