import { Router } from 'express';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import { bleEventSchema, fromIotSchema, idParamSchema, pairDeviceSchema, unpairBodySchema, } from './ble.schemas.js';
import * as svc from './ble.service.js';
export const bleDeviceRouter = Router();
export const bleEventRouter = Router();
export const iotEmergencyRouter = Router();
bleDeviceRouter.use(authGuard, roleGuard('user'));
bleEventRouter.use(authGuard, roleGuard('user'));
iotEmergencyRouter.use(authGuard, roleGuard('user'));
function ctx(req) {
    return {
        io: req.app.get('io'),
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
bleDeviceRouter.post('/pair', validateRequest({ body: pairDeviceSchema }), async (req, res, next) => {
    try {
        const data = await svc.pairDevice(req.validated.body, req.auth);
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
bleDeviceRouter.get('/', async (req, res, next) => {
    try {
        const data = await svc.listDevices(req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
bleDeviceRouter.post('/:id/unpair', validateRequest({ params: idParamSchema, body: unpairBodySchema }), async (req, res, next) => {
    try {
        const data = await svc.unpairDevice(req.validated.params.id, req.validated.body, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
bleEventRouter.post('/', validateRequest({ body: bleEventSchema }), async (req, res, next) => {
    try {
        const data = await svc.processBleEvent(req.validated.body, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
iotEmergencyRouter.post('/', validateRequest({ body: fromIotSchema }), async (req, res, next) => {
    try {
        const data = await svc.createFromIot(req.validated.body, req.auth, ctx(req));
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
