import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import {
  authGuard,
  roleGuard,
  validateRequest,
  adminActionLimiter,
} from '../../shared/middleware/index.js';
import {
  AmbulanceTransportRequest,
  AmbulanceUnit,
  Emergency,
  Responder,
} from '../../models/index.js';

const router = Router();

router.use(authGuard, roleGuard('admin'), adminActionLimiter);

const reportsQuerySchema = z.object({
  range: z.enum(['today', 'week', 'month', 'custom']).default('month'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(['medical', 'crime', 'fire', 'general_sos']).optional(),
  barangay: z.string().trim().max(120).optional(),
  responderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  ambulanceUnitId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});
type ReportsQuery = z.infer<typeof reportsQuerySchema>;

function resolveRange(q: ReportsQuery): { from: Date; to: Date } {
  const now = new Date();
  const to = q.to ? new Date(q.to) : now;
  let from: Date;
  if (q.range === 'custom' && q.from) {
    from = new Date(q.from);
  } else if (q.range === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (q.range === 'week') {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (q.range === 'month') {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { from, to };
}

router.get(
  '/reports',
  validateRequest({ query: reportsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.validated!.query as ReportsQuery;
      const { from, to } = resolveRange(q);

      // Emergency filter
      const emFilter: Record<string, unknown> = { createdAt: { $gte: from, $lte: to } };
      if (q.type) emFilter.type = q.type;
      if (q.barangay) emFilter.barangay = q.barangay;
      if (q.responderId)
        emFilter.assignedResponderId = new mongoose.Types.ObjectId(q.responderId);

      // Ambulance filter
      const ambFilter: Record<string, unknown> = { createdAt: { $gte: from, $lte: to } };
      if (q.responderId)
        ambFilter.assignedResponderId = new mongoose.Types.ObjectId(q.responderId);
      if (q.ambulanceUnitId)
        ambFilter.assignedAmbulanceUnitId = new mongoose.Types.ObjectId(q.ambulanceUnitId);

      const [
        totalIncidents,
        emergenciesByStatus,
        emergenciesByType,
        topBarangays,
        responderActivity,
        ambulanceTotal,
        ambulanceByStatus,
        ambulanceUsage,
        monthlyEmergencies,
        monthlyAmbulance,
        responseAgg,
      ] = await Promise.all([
        Emergency.countDocuments(emFilter),
        Emergency.aggregate<{ _id: string; count: number }>([
          { $match: emFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Emergency.aggregate<{ _id: string; count: number }>([
          { $match: emFilter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Emergency.aggregate<{ _id: string; count: number }>([
          { $match: { ...emFilter, barangay: { $exists: true, $ne: null } } },
          { $group: { _id: '$barangay', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Emergency.aggregate<{
          _id: mongoose.Types.ObjectId;
          count: number;
          name?: string;
        }>([
          {
            $match: {
              ...emFilter,
              assignedResponderId: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: '$assignedResponderId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'responders',
              localField: '_id',
              foreignField: '_id',
              as: 'responder',
            },
          },
          {
            $project: {
              count: 1,
              name: { $arrayElemAt: ['$responder.name', 0] },
            },
          },
        ]),
        AmbulanceTransportRequest.countDocuments(ambFilter),
        AmbulanceTransportRequest.aggregate<{ _id: string; count: number }>([
          { $match: ambFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        AmbulanceTransportRequest.aggregate<{
          _id: mongoose.Types.ObjectId;
          count: number;
          unitNumber?: number;
          unitName?: string;
          plateNumber?: string;
        }>([
          {
            $match: {
              ...ambFilter,
              assignedAmbulanceUnitId: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: '$assignedAmbulanceUnitId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          {
            $lookup: {
              from: 'ambulanceunits',
              localField: '_id',
              foreignField: '_id',
              as: 'unit',
            },
          },
          {
            $project: {
              count: 1,
              unitNumber: { $arrayElemAt: ['$unit.unitNumber', 0] },
              unitName: { $arrayElemAt: ['$unit.unitName', 0] },
              plateNumber: { $arrayElemAt: ['$unit.plateNumber', 0] },
            },
          },
        ]),
        Emergency.aggregate<{
          _id: { y: number; m: number; type: string };
          count: number;
        }>([
          { $match: emFilter },
          {
            $group: {
              _id: {
                y: { $year: '$createdAt' },
                m: { $month: '$createdAt' },
                type: '$type',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1 } },
        ]),
        AmbulanceTransportRequest.aggregate<{
          _id: { y: number; m: number };
          count: number;
        }>([
          { $match: ambFilter },
          {
            $group: {
              _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1 } },
        ]),
        Emergency.aggregate<{ avgMs: number; count: number }>([
          { $match: { ...emFilter, status: 'resolved' } },
          {
            $project: {
              createdAt: 1,
              firstDispatchAt: {
                $let: {
                  vars: {
                    events: {
                      $filter: {
                        input: '$timeline',
                        as: 't',
                        cond: {
                          $in: ['$$t.event', ['assigned', 'responder_on_the_way']],
                        },
                      },
                    },
                  },
                  in: { $arrayElemAt: ['$$events.at', 0] },
                },
              },
            },
          },
          { $match: { firstDispatchAt: { $ne: null } } },
          { $project: { ms: { $subtract: ['$firstDispatchAt', '$createdAt'] } } },
          {
            $group: { _id: null, avgMs: { $avg: '$ms' }, count: { $sum: 1 } },
          },
        ]),
      ]);

      const byStatus = (rows: { _id: string; count: number }[]) =>
        Object.fromEntries(rows.map((r) => [r._id, r.count]));

      const emStatuses = byStatus(emergenciesByStatus);
      const ambStatuses = byStatus(ambulanceByStatus);
      const resolvedIncidents = emStatuses.resolved ?? 0;
      const pendingIncidents =
        (emStatuses.pending ?? 0) +
        (emStatuses.assigned ?? 0) +
        (emStatuses.responder_on_the_way ?? 0) +
        (emStatuses.responder_nearby ?? 0) +
        (emStatuses.arrived ?? 0);

      const avgMs = responseAgg[0]?.avgMs ?? 0;
      const avgMinutes = avgMs > 0 ? Math.round(avgMs / 60_000) : 0;
      const averageResponseTime = responseAgg[0]?.count
        ? avgMinutes < 1
          ? '< 1 min'
          : `${avgMinutes} min`
        : 'No data';

      // Monthly trend: union the months over both datasets and emit per-type counts.
      type MonthBucket = {
        ym: string;
        year: number;
        month: number;
        medical: number;
        crime: number;
        fire: number;
        general_sos: number;
        ambulance: number;
      };
      const months = new Map<string, MonthBucket>();
      const ensure = (y: number, m: number) => {
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        let b = months.get(ym);
        if (!b) {
          b = {
            ym,
            year: y,
            month: m,
            medical: 0,
            crime: 0,
            fire: 0,
            general_sos: 0,
            ambulance: 0,
          };
          months.set(ym, b);
        }
        return b;
      };
      for (const r of monthlyEmergencies) {
        const b = ensure(r._id.y, r._id.m);
        if (r._id.type === 'medical') b.medical += r.count;
        else if (r._id.type === 'crime') b.crime += r.count;
        else if (r._id.type === 'fire') b.fire += r.count;
        else if (r._id.type === 'general_sos') b.general_sos += r.count;
      }
      for (const r of monthlyAmbulance) {
        const b = ensure(r._id.y, r._id.m);
        b.ambulance += r.count;
      }
      const monthlyTrend = Array.from(months.values()).sort((a, b) =>
        a.ym.localeCompare(b.ym),
      );

      res.json({
        data: {
          range: { from: from.toISOString(), to: to.toISOString() },
          totals: {
            totalIncidents,
            resolvedIncidents,
            pendingIncidents,
            ambulanceTotal,
            averageResponseTime,
          },
          incidentsByType: byStatus(emergenciesByType),
          ambulanceByStatus: ambStatuses,
          topBarangays: topBarangays.map((r) => ({
            barangay: r._id,
            count: r.count,
          })),
          responderActivity: responderActivity.map((r) => ({
            responderId: r._id.toString(),
            name: r.name ?? 'Unknown',
            count: r.count,
          })),
          ambulanceUsage: ambulanceUsage.map((r) => ({
            unitId: r._id.toString(),
            unitNumber: r.unitNumber,
            unitName: r.unitName,
            plateNumber: r.plateNumber,
            count: r.count,
          })),
          monthlyTrend,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/reports/filters',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [responders, units, barangays] = await Promise.all([
        Responder.find({ approvalStatus: 'approved' })
          .select('name responderRole department')
          .sort({ name: 1 })
          .limit(200)
          .lean(),
        AmbulanceUnit.find()
          .select('unitNumber unitName plateNumber')
          .sort({ unitNumber: 1 })
          .lean(),
        Emergency.distinct('barangay'),
      ]);
      res.json({
        data: {
          responders: responders.map((r) => ({
            id: (r._id as mongoose.Types.ObjectId).toString(),
            name: r.name,
            role: r.responderRole ?? r.department,
          })),
          ambulanceUnits: units.map((u) => ({
            id: (u._id as mongoose.Types.ObjectId).toString(),
            unitNumber: u.unitNumber,
            unitName: u.unitName,
            plateNumber: u.plateNumber,
          })),
          barangays: (barangays as (string | null)[]).filter(
            (b): b is string => !!b && b.length > 0,
          ),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
