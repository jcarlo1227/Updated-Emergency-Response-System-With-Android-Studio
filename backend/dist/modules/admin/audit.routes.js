import { Router } from 'express';
import { z } from 'zod';
import { authGuard, roleGuard, validateRequest, adminActionLimiter } from '../../shared/middleware/index.js';
import { AuditLog, Emergency, AmbulanceTransportRequest, Responder, User } from '../../models/index.js';
const router = Router();
router.use(authGuard, roleGuard('admin'), adminActionLimiter);
const auditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    actorRole: z.enum(['user', 'responder', 'admin', 'system']).optional(),
    action: z.string().trim().max(120).optional(),
    targetType: z.string().trim().max(80).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
}).strict();
router.get('/audit-logs', validateRequest({ query: auditQuerySchema }), async (req, res, next) => {
    try {
        const q = req.validated.query;
        const filter = {};
        if (q.actorRole)
            filter.actorRole = q.actorRole;
        if (q.action)
            filter.action = { $regex: q.action, $options: 'i' };
        if (q.targetType)
            filter.targetType = q.targetType;
        if (q.from || q.to) {
            const dateFilter = {};
            if (q.from)
                dateFilter.$gte = new Date(q.from);
            if (q.to)
                dateFilter.$lte = new Date(q.to);
            filter.createdAt = dateFilter;
        }
        const skip = (q.page - 1) * q.limit;
        const [items, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
            AuditLog.countDocuments(filter),
        ]);
        res.json({ data: { items, total, page: q.page, limit: q.limit } });
    }
    catch (err) {
        next(err);
    }
});
router.get('/analytics/summary', async (_req, res, next) => {
    try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeStatuses = ['pending', 'assigned', 'responder_on_the_way', 'responder_nearby', 'arrived'];
        const [activeEmergencies, last24hEmergencies, pendingUsers, pendingResponders, pendingAmbulance, completedAmbulance30d, activeResponders,] = await Promise.all([
            Emergency.countDocuments({ status: { $in: activeStatuses } }),
            Emergency.countDocuments({ createdAt: { $gte: since24h } }),
            User.countDocuments({ approvalStatus: 'pending' }),
            Responder.countDocuments({ approvalStatus: 'pending' }),
            AmbulanceTransportRequest.countDocuments({ status: 'pending_review' }),
            AmbulanceTransportRequest.countDocuments({ status: 'completed', updatedAt: { $gte: since30d } }),
            Responder.countDocuments({ isApproved: true, dutyStatus: { $in: ['on_duty', 'busy'] } }),
        ]);
        const byType = await Emergency.aggregate([
            { $match: { createdAt: { $gte: since30d } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);
        res.json({
            data: {
                activeEmergencies,
                last24hEmergencies,
                pendingApprovals: pendingUsers + pendingResponders,
                pendingAmbulanceRequests: pendingAmbulance,
                completedTransports30d: completedAmbulance30d,
                activeResponders,
                emergenciesByType: Object.fromEntries(byType.map((b) => [b._id, b.count])),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
router.get('/analytics/monthly', async (_req, res, next) => {
    try {
        const since12m = new Date();
        since12m.setMonth(since12m.getMonth() - 11);
        since12m.setDate(1);
        since12m.setHours(0, 0, 0, 0);
        const monthly = await Emergency.aggregate([
            { $match: { createdAt: { $gte: since12m } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        res.json({ data: monthly });
    }
    catch (err) {
        next(err);
    }
});
export default router;
