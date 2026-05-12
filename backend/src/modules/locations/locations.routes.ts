import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { z } from 'zod';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import type { DutyStatus } from '../../models/index.js';
import {
  historyQuerySchema,
  idParamSchema,
  ingestLocationSchema,
  type HistoryQuery,
  type IdParam,
  type IngestLocationInput,
} from './locations.schemas.js';
import * as svc from './locations.service.js';

const dutyBodySchema = z.object({
  status: z.enum([
    'off_duty',
    'on_duty',
    'busy',
    'available',
    'responding',
    'inactive',
    'unavailable',
    'offline',
  ]),
}).strict();

export const locationsRouter = Router();
export const emergencyHistoryRouter = Router();
export const ambulanceHistoryRouter = Router();
export const respondersLiveRouter = Router();

locationsRouter.use(authGuard);
emergencyHistoryRouter.use(authGuard);
ambulanceHistoryRouter.use(authGuard);
respondersLiveRouter.use(authGuard, roleGuard('admin', 'responder'));

function ctx(req: Request) {
  return {
    io: req.app.get('io') as SocketServer | undefined,
    requestId: req.requestId,
  };
}

locationsRouter.post(
  '/user',
  roleGuard('user'),
  validateRequest({ body: ingestLocationSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.ingestUserLocation(
        req.validated!.body as IngestLocationInput,
        req.auth!,
        ctx(req),
      );
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },
);

locationsRouter.post(
  '/responder',
  roleGuard('responder'),
  validateRequest({ body: ingestLocationSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.ingestResponderLocation(
        req.validated!.body as IngestLocationInput,
        req.auth!,
        ctx(req),
      );
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },
);

emergencyHistoryRouter.get(
  '/:id/location-history',
  validateRequest({ params: idParamSchema, query: historyQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const data = await svc.getEmergencyLocationHistory(
        id,
        req.validated!.query as HistoryQuery,
        req.auth!,
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

ambulanceHistoryRouter.get(
  '/:id/location-history',
  validateRequest({ params: idParamSchema, query: historyQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const data = await svc.getAmbulanceLocationHistory(
        id,
        req.validated!.query as HistoryQuery,
        req.auth!,
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

respondersLiveRouter.get(
  '/locations/live',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.getRespondersLive();
      res.json({ data });
    } catch (err) { next(err); }
  },
);

respondersLiveRouter.post(
  '/duty',
  roleGuard('responder'),
  validateRequest({ body: dutyBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.validated!.body as { status: DutyStatus };
      const data = await svc.updateResponderDutyStatus(
        req.auth!.accountId,
        status,
        ctx(req),
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);
