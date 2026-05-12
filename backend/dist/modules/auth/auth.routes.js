import { Router } from 'express';
import multer from 'multer';
import { validateRequest, authGuard, loginLimiter, registrationLimiter, refreshTokenLimiter, } from '../../shared/middleware/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { changePasswordSchema, loginSchema, logoutSchema, refreshSchema, registerResponderSchema, registerUserSchema, } from './auth.schemas.js';
import * as authService from './auth.service.js';
const router = Router();
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per image
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 2 },
    fileFilter: (_req, file, cb) => {
        if (!/^image\//.test(file.mimetype)) {
            cb(new AppError('Only image uploads are allowed', 400, 'INVALID_FILE_TYPE'));
            return;
        }
        cb(null, true);
    },
});
const registrationUpload = upload.fields([
    { name: 'faceCapture', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 },
]);
const responderRegistrationUpload = upload.fields([
    { name: 'faceCapture', maxCount: 1 },
    { name: 'credential', maxCount: 1 },
]);
router.post('/register/user', registrationLimiter, registrationUpload, validateRequest({ body: registerUserSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const filesByField = req.files;
        const faceCapture = filesByField?.faceCapture?.[0];
        const proofOfResidency = filesByField?.proofOfResidency?.[0];
        if (!faceCapture) {
            throw new AppError('Face photo is required', 400, 'MISSING_FACE_CAPTURE');
        }
        if (!proofOfResidency) {
            throw new AppError('Valid ID is required', 400, 'MISSING_VALID_ID');
        }
        const result = await authService.registerUser(input, req, {
            faceCapture,
            proofOfResidency,
        });
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
router.post('/register/responder', registrationLimiter, responderRegistrationUpload, validateRequest({ body: registerResponderSchema }), async (req, res, next) => {
    try {
        const input = req.validated.body;
        const filesByField = req.files;
        const files = {
            faceCapture: filesByField?.faceCapture?.[0],
            credential: filesByField?.credential?.[0],
        };
        const result = await authService.registerResponder(input, req, files);
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
router.post('/change-password', authGuard, validateRequest({ body: changePasswordSchema }), async (req, res, next) => {
    try {
        const auth = req.auth;
        const input = req.validated.body;
        await authService.changePassword(auth.accountId, auth.role, input.currentPassword, input.newPassword);
        res.json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
export default router;
