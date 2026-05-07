import { ZodError } from 'zod';
export function validateRequest(schemas) {
    return (req, _res, next) => {
        try {
            const validated = {
                body: schemas.body ? schemas.body.parse(req.body) : req.body,
                query: schemas.query ? schemas.query.parse(req.query) : req.query,
                params: schemas.params ? schemas.params.parse(req.params) : req.params,
            };
            req.validated = validated;
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                next(err);
                return;
            }
            next(err);
        }
    };
}
