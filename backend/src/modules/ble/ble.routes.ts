import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import {
  bleEventSchema,
  fromIotSchema,
  idParamSchema,
  pairDeviceSchema,
  unpairBodySchema,
  type BleEventInput,
  type FromIotInput,
  type IdParam,
  type PairDeviceInput,
  type UnpairBody,
} from './ble.schemas.js';
import * as svc from './ble.service.js';

export const bleDeviceRouter = Router();
export const bleEventRouter = Router();
export const iotEmergencyRouter = Router();

bleDeviceRouter.use(authGuard, roleGuard('user'));
bleEventRouter.use(authGuard, roleGuard('user'));
iotEmergencyRouter.use(authGuard, roleGuard('user'));

function ctx(req: Request) {
  return {
    io: req.app.get('io') as SocketServer | undefined,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

bleDeviceRouter.post(
  '/pair',
  validateRequest({ body: pairDeviceSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.pairDevice(req.validated!.body as PairDeviceInput, req.auth!);
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },
);

bleDeviceRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.listDevices(req.auth!);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

bleDeviceRouter.post(
  '/:id/unpair',
  validateRequest({ params: idParamSchema, body: unpairBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.unpairDevice(
        (req.validated!.params as IdParam).id,
        req.validated!.body as UnpairBody,
        req.auth!,
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

bleEventRouter.post(
  '/',
  validateRequest({ body: bleEventSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.processBleEvent(req.validated!.body as BleEventInput, req.auth!);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

iotEmergencyRouter.post(
  '/',
  validateRequest({ body: fromIotSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.createFromIot(req.validated!.body as FromIotInput, req.auth!, ctx(req));
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },
);
