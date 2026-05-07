import { Router } from 'express';
import { validateRequest, authGuard, loginLimiter, registrationLimiter, refreshTokenLimiter, } from '../../shared/middleware/index.js';
import { loginSchema, logoutSchema, refreshSchema, registerResponderSchema, registerUserSchema, } from './auth.schemas.js';
import * as authService from './auth.service.js';
const router = Router();
router.post('/register/user', registrationLimiter, validateRequest({ body: registerUserSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const result = await authService.registerUser(input, req);
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
router.post('/register/responder', registrationLimiter, validateRequest({ body: registerResponderSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const result = await authService.registerResponder(input, req);
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
router.post('/login', loginLimiter, validateRequest({ body: loginSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const result = await authService.login(input, req);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
router.post('/refresh', refreshTokenLimiter, validateRequest({ body: refreshSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const result = await authService.refresh(input.refreshToken, req);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
router.post('/logout', validateRequest({ body: logoutSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        await authService.logout(input.refreshToken);
        res.json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
router.get('/me', authGuard, async (req, res, next) => {
    try {
        const auth = req.auth;
        const result = await authService.getMe(auth.accountId, auth.role);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
export default router;
