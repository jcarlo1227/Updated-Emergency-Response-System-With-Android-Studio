import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import {
  adminActionLimiter,
  authGuard,
  roleGuard,
  validateRequest,
} from '../../shared/middleware/index.js';
import {
  idParamSchema,
  resolveBodySchema,
  type IdParam,
  type ResolveBody,
} from './emergencies.schemas.js';
import * as svc from './emergencies.service.js';

const router = Router();

router.use(authGuard, roleGuard('admin'));

router.post(
  '/:id/resolve',
  adminActionLimiter,
  validateRequest({ params: idParamSchema, body: resolveBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const body = req.validated!.body as ResolveBody;
      const io = req.app.get('io') as SocketServer | undefined;
      const data = await svc.resolve(id, body, req.auth!, {
        io,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
