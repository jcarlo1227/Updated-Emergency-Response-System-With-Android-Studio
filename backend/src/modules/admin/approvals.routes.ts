import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  authGuard,
  roleGuard,
  validateRequest,
  adminActionLimiter,
} from '../../shared/middleware/index.js';
import {
  approveBodySchema,
  idParamSchema,
  listRegistrationsQuerySchema,
  rejectBodySchema,
  typeQuerySchema,
  type ApproveBody,
  type IdParam,
  type ListRegistrationsQuery,
  type RejectBody,
  type TypeQuery,
} from './approvals.schemas.js';
import * as approvalsService from './approvals.service.js';

const router = Router();

router.use(authGuard, roleGuard('admin'));

router.get(
  '/registrations',
  adminActionLimiter,
  validateRequest({ query: listRegistrationsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.validated!.query as ListRegistrationsQuery;
      const data = await approvalsService.listRegistrations(q);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/registrations/:id',
  adminActionLimiter,
  validateRequest({ params: idParamSchema, query: typeQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const { type } = req.validated!.query as TypeQuery;
      const data = await approvalsService.getRegistration(id, type);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/registrations/:id/approve',
  adminActionLimiter,
  validateRequest({ params: idParamSchema, body: approveBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const body = req.validated!.body as ApproveBody;
      const data = await approvalsService.approveRegistration({
        id,
        type: body.type,
        notes: body.notes,
        admin: {
          adminId: req.auth!.accountId,
          requestId: req.requestId,
          ip: req.ip,
          userAgent: req.header('user-agent') ?? undefined,
        },
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/registrations/:id/reject',
  adminActionLimiter,
  validateRequest({ params: idParamSchema, body: rejectBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const body = req.validated!.body as RejectBody;
      const data = await approvalsService.rejectRegistration({
        id,
        type: body.type,
        reason: body.reason,
        admin: {
          adminId: req.auth!.accountId,
          requestId: req.requestId,
          ip: req.ip,
          userAgent: req.header('user-agent') ?? undefined,
        },
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
