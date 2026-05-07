import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import {
  adminActionLimiter,
  authGuard,
  roleGuard,
  validateRequest,
} from '../../shared/middleware/index.js';
import {
  approveBodySchema,
  assignBodySchema,
  availableUnitsQuerySchema,
  idParamSchema,
  listAdminQuerySchema,
  rejectBodySchema,
  responderUpdateBodySchema,
  type ApproveBody,
  type AssignBody,
  type AvailableUnitsQuery,
  type IdParam,
  type ListAdminQuery,
  type RejectBody,
  type ResponderUpdateBody,
} from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';

const router = Router();

router.use(authGuard, roleGuard('admin'), adminActionLimiter);

function ctx(req: Request) {
  return {
    io: req.app.get('io') as SocketServer | undefined,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

router.get(
  '/',
  validateRequest({ query: listAdminQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.listAdmin(req.validated!.query as ListAdminQuery);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.get(
  '/units/available',
  validateRequest({ query: availableUnitsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.getAvailableUnitsForAdmin(
        req.validated!.query as AvailableUnitsQuery,
      );
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
  '/:id/approve',
  validateRequest({ params: idParamSchema, body: approveBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notes } = req.validated!.body as ApproveBody;
      const data = await svc.approve(
        (req.validated!.params as IdParam).id,
        notes,
        req.auth!,
        ctx(req),
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.post(
  '/:id/reject',
  validateRequest({ params: idParamSchema, body: rejectBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.validated!.body as RejectBody;
      const data = await svc.reject(
        (req.validated!.params as IdParam).id,
        reason,
        req.auth!,
        ctx(req),
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

router.post(
  '/:id/assign',
  validateRequest({ params: idParamSchema, body: assignBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.assign(
        (req.validated!.params as IdParam).id,
        req.validated!.body as AssignBody,
        req.auth!,
        ctx(req),
      );
      res.json({ data });
    } catch (err) { next(err); }
  },
);

const noteValidate = validateRequest({
  params: idParamSchema,
  body: responderUpdateBodySchema,
});

type RequestCtx = ReturnType<typeof ctx>;

function adminTransitionHandler(
  fn: (
    id: string,
    note: string | undefined,
    auth: import('../../shared/types/http.js').AuthContext,
    requestCtx: RequestCtx,
  ) => Promise<unknown>,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = (req.validated!.params as IdParam).id;
      const body = req.validated!.body as ResponderUpdateBody;
      const data = await fn(id, body.note, req.auth!, ctx(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };
}

router.post('/:id/mark-on-the-way', noteValidate, adminTransitionHandler(svc.adminMarkOnTheWay));
router.post('/:id/mark-picked-up', noteValidate, adminTransitionHandler(svc.adminMarkPickedUp));
router.post('/:id/mark-completed', noteValidate, adminTransitionHandler(svc.adminMarkCompleted));

export default router;
