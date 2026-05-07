import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, z } from 'zod';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = {
        body: schemas.body ? schemas.body.parse(req.body) : req.body,
        query: schemas.query ? schemas.query.parse(req.query) : req.query,
        params: schemas.params ? schemas.params.parse(req.params) : req.params,
      };
      req.validated = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
        return;
      }
      next(err);
    }
  };
}

export type Infer<T extends ZodTypeAny> = z.infer<T>;
