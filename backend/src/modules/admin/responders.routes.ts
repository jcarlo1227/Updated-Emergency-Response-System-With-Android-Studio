import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  authGuard,
  roleGuard,
  validateRequest,
  adminActionLimiter,
} from '../../shared/middleware/index.js';
import {
  createResponderSchema,
  type CreateResponderInput,
} from './responders.schemas.js';
import * as svc from './responders.service.js';

const router = Router();

router.use(authGuard, roleGuard('admin'), adminActionLimiter);

router.get(
  '/ambulance-units',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.listAmbulanceUnits();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/responders',
  validateRequest({ body: createResponderSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.validated!.body as CreateResponderInput;
      const data = await svc.createResponder(input, {
        adminId: req.auth!.accountId,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
      });
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
