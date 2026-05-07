import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import {
  authGuard,
  roleGuard,
  validateRequest,
  ambulanceRequestLimiter,
  ambulanceAvailabilityLimiter,
} from '../../shared/middleware/index.js';
import {
  availabilityQuerySchema,
  cancelBodySchema,
  createAmbulanceRequestSchema,
  idParamSchema,
  listMineQuerySchema,
  type AvailabilityQuery,
  type CancelBody,
  type CreateAmbulanceRequestInput,
  type IdParam,
  type ListMineQuery,
} from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';

const router = Router();

router.use(authGuard, roleGuard('user'));

function ctx(req: Request) {
  return {
    io: req.app.get('io') as SocketServer | undefined,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

router.post(
  '/',
  ambulanceRequestLimiter,
  validateRequest({ body: createAmbulanceRequestSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.createRequest(
        req.validated!.body as CreateAmbulanceRequestInput,
        req.auth!,
        ctx(req),
      );
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },
);

router.get(
  '/my',
  validateRequest({ query: listMineQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.listMine(req.validated!.query as ListMineQuery, req.auth!);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.get(
  '/availability',
  ambulanceAvailabilityLimiter,
  validateRequest({ query: availabilityQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.checkAvailability(req.validated!.query as AvailabilityQuery);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.getOne((req.validated!.params as IdParam).id, req.auth!);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.post(
  '/:id/cancel',
  validateRequest({ params: idParamSchema, body: cancelBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.cancel(
        (req.validated!.params as IdParam).id,
        req.validated!.body as CancelBody,
        req.auth!,
        ctx(req),
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

export default router;
