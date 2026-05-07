import { Router } from 'express';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import { historyQuerySchema, idParamSchema, ingestLocationSchema, } from './locations.schemas.js';
import * as svc from './locations.service.js';
export const locationsRouter = Router();
export const emergencyHistoryRouter = Router();
export const ambulanceHistoryRouter = Router();
export const respondersLiveRouter = Router();
locationsRouter.use(authGuard);
emergencyHistoryRouter.use(authGuard);
ambulanceHistoryRouter.use(authGuard);
respondersLiveRouter.use(authGuard, roleGuard('admin', 'responder'));
function ctx(req) {
    return {
        io: req.app.get('io'),
        requestId: req.requestId,
    };
}
locationsRouter.post('/user', roleGuard('user'), validateRequest({ body: ingestLocationSchema }), async (req, res, next) => {
    try {
        const data = await svc.ingestUserLocation(req.validated.body, req.auth, ctx(req));
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
locationsRouter.post('/responder', roleGuard('responder'), validateRequest({ body: ingestLocationSchema }), async (req, res, next) => {
    try {
        const data = await svc.ingestResponderLocation(req.validated.body, req.auth, ctx(req));
        res.status(201).json({ data });
    }
    catch (err) {
        next(err);
    }
});
emergencyHistoryRouter.get('/:id/location-history', validateRequest({ params: idParamSchema, query: historyQuerySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const data = await svc.getEmergencyLocationHistory(id, req.validated.query, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
ambulanceHistoryRouter.get('/:id/location-history', validateRequest({ params: idParamSchema, query: historyQuerySchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const data = await svc.getAmbulanceLocationHistory(id, req.validated.query, req.auth);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
respondersLiveRouter.get('/locations/live', async (_req, res, next) => {
    try {
        const data = await svc.getRespondersLive();
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
