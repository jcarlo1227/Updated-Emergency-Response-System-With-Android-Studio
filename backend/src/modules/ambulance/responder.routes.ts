import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { authGuard, roleGuard, validateRequest } from '../../shared/middleware/index.js';
import type { AuthContext } from '../../shared/types/http.js';
import {
  idParamSchema,
  responderUpdateBodySchema,
  type IdParam,
  type ResponderUpdateBody,
} from './ambulance.schemas.js';
import * as svc from './ambulance.service.js';

const router = Router();

router.use(authGuard, roleGuard('responder'));

interface ServiceCtx {
  io?: SocketServer;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

function buildCtx(req: Request): ServiceCtx {
  return {
    io: req.app.get('io') as SocketServer | undefined,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

function makeHandler(
  fn: (id: string, body: ResponderUpdateBody, auth: AuthContext, ctx: ServiceCtx) => Promise<unknown>,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.validated!.params as IdParam;
      const body = req.validated!.body as ResponderUpdateBody;
      const data = await fn(id, body, req.auth!, buildCtx(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };
}

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await svc.listResponderAssigned(req.auth!);
      res.json({ data });
    } catch (err) { next(err); }
  },
);

const validate = validateRequest({
  params: idParamSchema,
  body: responderUpdateBodySchema,
});

router.post('/:id/on-the-way', validate, makeHandler(svc.setOnTheWay));
router.post('/:id/arrived-pickup', validate, makeHandler(svc.setArrivedPickup));
router.post('/:id/patient-onboard', validate, makeHandler(svc.setPatientOnboard));
router.post('/:id/complete', validate, makeHandler(svc.complete));

export default router;
