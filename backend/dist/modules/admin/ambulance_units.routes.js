import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authGuard, roleGuard, validateRequest, adminActionLimiter, } from '../../shared/middleware/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { AmbulanceUnit, AuditLog, Responder } from '../../models/index.js';
const router = Router();
router.use(authGuard, roleGuard('admin'), adminActionLimiter);
const UNIT_TYPES = ['bls', 'als', 'patient_transport', 'rescue', 'other'];
const AVAILABILITY = ['available', 'assigned', 'maintenance', 'out_of_service'];
const idParamSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});
const createUnitSchema = z.object({
    unitNumber: z.coerce.number().int().min(1).max(12).optional(),
    unitName: z.string().trim().min(1).max(80).optional(),
    plateNumber: z.string().trim().min(1).max(20).optional(),
    unitType: z.enum(UNIT_TYPES).optional(),
    availabilityStatus: z.enum(AVAILABILITY).default('available'),
    assignedDriverId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, 'Invalid driver id')
        .optional(),
    notes: z.string().trim().max(500).optional(),
});
const updateUnitSchema = createUnitSchema.partial();
function adminContext(req) {
    return {
        adminId: req.auth.accountId,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
    };
}
async function nextUnitNumber() {
    const max = await AmbulanceUnit.findOne().sort({ unitNumber: -1 }).select('unitNumber').lean();
    return (max?.unitNumber ?? 0) + 1;
}
router.get('/ambulance-units/:id', validateRequest({ params: idParamSchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const unit = await AmbulanceUnit.findById(id).lean();
        if (!unit)
            throw new AppError('Unit not found', 404, 'NOT_FOUND');
        res.json({ data: unit });
    }
    catch (err) {
        next(err);
    }
});
router.post('/ambulance-units', validateRequest({ body: createUnitSchema }), async (req, res, next) => {
    try {
        const body = req.validated.body;
        let unitNumber = body.unitNumber;
        if (unitNumber == null) {
            unitNumber = await nextUnitNumber();
            if (unitNumber > 12) {
                throw new AppError('Unit number cap reached (12). Specify a number explicitly.', 409, 'UNIT_CAP');
            }
        }
        if (body.assignedDriverId) {
            const driver = await Responder.findById(body.assignedDriverId);
            if (!driver)
                throw new AppError('Driver not found', 404, 'NOT_FOUND');
        }
        let created;
        try {
            created = await AmbulanceUnit.create({
                ...body,
                unitNumber,
                assignedDriverId: body.assignedDriverId
                    ? new mongoose.Types.ObjectId(body.assignedDriverId)
                    : undefined,
            });
        }
        catch (err) {
            if (err instanceof Error && 'code' in err && err.code === 11000) {
                throw new AppError(`Ambulance unit ${unitNumber} already exists`, 409, 'UNIT_EXISTS');
            }
            throw err;
        }
        const ctx = adminContext(req);
        await AuditLog.create({
            actorId: new mongoose.Types.ObjectId(ctx.adminId),
            actorRole: 'admin',
            action: 'ambulance_unit.created',
            targetType: 'ambulance_unit',
            targetId: created._id,
            meta: { unitNumber: created.unitNumber, plateNumber: created.plateNumber },
            requestId: ctx.requestId,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
        });
        res.status(201).json({ data: created.toJSON() });
    }
    catch (err) {
        next(err);
    }
});
router.patch('/ambulance-units/:id', validateRequest({ params: idParamSchema, body: updateUnitSchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const body = req.validated.body;
        const unit = await AmbulanceUnit.findById(id);
        if (!unit)
            throw new AppError('Unit not found', 404, 'NOT_FOUND');
        if (body.assignedDriverId) {
            const driver = await Responder.findById(body.assignedDriverId);
            if (!driver)
                throw new AppError('Driver not found', 404, 'NOT_FOUND');
        }
        const before = {
            unitName: unit.unitName,
            plateNumber: unit.plateNumber,
            unitType: unit.unitType,
            availabilityStatus: unit.availabilityStatus,
        };
        if (body.unitName !== undefined)
            unit.unitName = body.unitName;
        if (body.plateNumber !== undefined)
            unit.plateNumber = body.plateNumber;
        if (body.unitType !== undefined)
            unit.unitType = body.unitType;
        if (body.availabilityStatus !== undefined)
            unit.availabilityStatus = body.availabilityStatus;
        if (body.notes !== undefined)
            unit.notes = body.notes;
        if (body.assignedDriverId !== undefined) {
            unit.assignedDriverId = body.assignedDriverId
                ? new mongoose.Types.ObjectId(body.assignedDriverId)
                : undefined;
        }
        if (body.unitNumber !== undefined && body.unitNumber !== unit.unitNumber) {
            const conflict = await AmbulanceUnit.findOne({
                unitNumber: body.unitNumber,
                _id: { $ne: unit._id },
            }).lean();
            if (conflict)
                throw new AppError('Unit number already in use', 409, 'UNIT_EXISTS');
            unit.unitNumber = body.unitNumber;
        }
        await unit.save();
        const ctx = adminContext(req);
        await AuditLog.create({
            actorId: new mongoose.Types.ObjectId(ctx.adminId),
            actorRole: 'admin',
            action: 'ambulance_unit.updated',
            targetType: 'ambulance_unit',
            targetId: unit._id,
            meta: { before, after: body },
            requestId: ctx.requestId,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
        });
        res.json({ data: unit.toJSON() });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/ambulance-units/:id', validateRequest({ params: idParamSchema }), async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const unit = await AmbulanceUnit.findById(id);
        if (!unit)
            throw new AppError('Unit not found', 404, 'NOT_FOUND');
        if (unit.activeRequestId) {
            throw new AppError('Cannot delete a unit currently assigned to a request. Mark inactive instead.', 409, 'UNIT_IN_USE');
        }
        const snapshot = {
            unitNumber: unit.unitNumber,
            unitName: unit.unitName,
            plateNumber: unit.plateNumber,
        };
        await unit.deleteOne();
        const ctx = adminContext(req);
        await AuditLog.create({
            actorId: new mongoose.Types.ObjectId(ctx.adminId),
            actorRole: 'admin',
            action: 'ambulance_unit.deleted',
            targetType: 'ambulance_unit',
            targetId: unit._id,
            meta: snapshot,
            requestId: ctx.requestId,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
        });
        res.json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
export default router;
