import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authGuard, roleGuard, validateRequest, adminActionLimiter } from '../../shared/middleware/index.js';
import { AuditLog, Emergency, AmbulanceTransportRequest, Responder, User } from '../../models/index.js';
import { humanizeAudit, KNOWN_MODULES } from './audit.humanize.js';
const router = Router();
router.use(authGuard, roleGuard('admin'), adminActionLimiter);
const auditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    actorRole: z.enum(['user', 'responder', 'admin', 'system']).optional(),
    module: z.enum(KNOWN_MODULES).optional(),
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    action: z.string().trim().max(120).optional(),
    search: z.string().trim().max(120).optional(),
    targetType: z.string().trim().max(80).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
}).strict();
router.get('/audit-logs/modules', (_req, res) => {
    res.json({ data: KNOWN_MODULES });
});
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
        if (q.severity)
            filter.severity = q.severity;
        // Module filter intentionally not pushed to DB: most legacy logs lack
        // a stored `module`. Filter post-humanize so old + new logs both work.
        if (q.from || q.to) {
            const dateFilter = {};
            if (q.from)
                dateFilter.$gte = new Date(q.from);
            if (q.to)
                dateFilter.$lte = new Date(q.to);
            filter.createdAt = dateFilter;
        }
        const skip = (q.page - 1) * q.limit;
        // Fetch a wider slice when module/search filtering is on so post-filter
        // results still fill the page (cheap because cap is 200 / page).
        const fetchLimit = q.module || q.search ? Math.min(q.limit * 4, 800) : q.limit;
        const fetchSkip = q.module || q.search ? 0 : skip;
        const [rawItems, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(fetchSkip).limit(fetchLimit).lean(),
            AuditLog.countDocuments(filter),
        ]);
        let enriched = rawItems.map((log) => {
            const h = humanizeAudit(log);
            return { ...log, module: h.module, description: h.description, severity: h.severity };
        });
        if (q.module)
            enriched = enriched.filter((l) => l.module === q.module);
        if (q.search) {
            const term = q.search.toLowerCase();
            enriched = enriched.filter((l) => l.description.toLowerCase().includes(term) ||
                (l.reason ?? '').toLowerCase().includes(term) ||
                (l.actorName ?? '').toLowerCase().includes(term) ||
                l.action.toLowerCase().includes(term));
        }
        const paged = q.module || q.search
            ? enriched.slice(skip, skip + q.limit)
            : enriched;
        res.json({
            data: { items: paged, total: q.module || q.search ? enriched.length : total, page: q.page, limit: q.limit },
        });
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
router.get('/overview', async (req, res, next) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const activeEmergencyStatuses = [
            'pending',
            'assigned',
            'responder_on_the_way',
            'responder_nearby',
            'arrived',
        ];
        const [activeEmergencies, pendingAmbulance, availableResponders, activeResponders, pendingUsers, pendingResponders, resolvedToday,] = await Promise.all([
            Emergency.countDocuments({ status: { $in: activeEmergencyStatuses } }),
            AmbulanceTransportRequest.countDocuments({ status: 'pending_review' }),
            Responder.countDocuments({ isApproved: true, dutyStatus: 'available' }),
            Responder.countDocuments({
                isApproved: true,
                dutyStatus: { $in: ['busy', 'on_duty'] },
            }),
            User.countDocuments({ approvalStatus: 'pending' }),
            Responder.countDocuments({ approvalStatus: 'pending' }),
            Emergency.countDocuments({
                status: 'resolved',
                resolvedAt: { $gte: startOfToday },
            }),
        ]);
        // Average response time: from emergency.createdAt to the first
        // 'assigned' or 'responder_on_the_way' timeline event, over last 30 days.
        const responseAgg = await Emergency.aggregate([
            { $match: { createdAt: { $gte: since30d }, status: 'resolved' } },
            {
                $project: {
                    createdAt: 1,
                    firstDispatchAt: {
                        $let: {
                            vars: {
                                dispatchEvents: {
                                    $filter: {
                                        input: '$timeline',
                                        as: 't',
                                        cond: {
                                            $in: ['$$t.event', ['assigned', 'responder_on_the_way']],
                                        },
                                    },
                                },
                            },
                            in: { $arrayElemAt: ['$$dispatchEvents.at', 0] },
                        },
                    },
                },
            },
            { $match: { firstDispatchAt: { $ne: null } } },
            {
                $project: {
                    ms: { $subtract: ['$firstDispatchAt', '$createdAt'] },
                },
            },
            {
                $group: {
                    _id: null,
                    avgMs: { $avg: '$ms' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const avgMs = responseAgg[0]?.avgMs ?? 0;
        const avgMinutes = avgMs > 0 ? Math.round(avgMs / 60_000) : 0;
        const averageResponseTime = responseAgg[0]?.count
            ? avgMinutes < 1
                ? '< 1 min'
                : `${avgMinutes} min`
            : 'No data';
        const io = req.app.get('io');
        const systemStatus = {
            api: 'online',
            database: mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected',
            socket: io ? 'connected' : 'disconnected',
            map: 'active',
        };
        res.json({
            data: {
                activeEmergencies,
                pendingAmbulanceRequests: pendingAmbulance,
                availableResponders,
                activeResponders,
                pendingApprovals: pendingUsers + pendingResponders,
                resolvedToday,
                averageResponseTime,
                systemStatus,
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
