import { randomUUID } from 'crypto';
export function requestId(req, res, next) {
    const incoming = req.header('x-request-id');
    const id = incoming && incoming.length <= 120 ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
}
