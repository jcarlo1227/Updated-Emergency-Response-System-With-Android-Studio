import mongoose from 'mongoose';
import { AuditLog, Responder, User } from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import type { AccountType } from './approvals.schemas.js';

interface AdminContext {
  adminId: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

const PUBLIC_FIELDS = '-password';

export async function listRegistrations(args: {
  type: AccountType;
  status: 'pending' | 'approved' | 'rejected';
  page: number;
  limit: number;
}) {
  const filter = { approvalStatus: args.status };
  const skip = (args.page - 1) * args.limit;
  if (args.type === 'user') {
    const [items, total] = await Promise.all([
      User.find(filter)
        .select(PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(args.limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return { items, total, page: args.page, limit: args.limit };
  }
  const [items, total] = await Promise.all([
    Responder.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(args.limit)
      .lean(),
    Responder.countDocuments(filter),
  ]);
  return { items, total, page: args.page, limit: args.limit };
}

export async function getRegistration(id: string, type: AccountType) {
  const doc =
    type === 'user'
      ? await User.findById(id).select(PUBLIC_FIELDS).lean()
      : await Responder.findById(id).select(PUBLIC_FIELDS).lean();
  if (!doc) throw new AppError('Registration not found', 404, 'NOT_FOUND');
  return doc;
}

export async function approveRegistration(args: {
  id: string;
  type: AccountType;
  notes?: string;
  admin: AdminContext;
}) {
  const adminObjectId = new mongoose.Types.ObjectId(args.admin.adminId);

  const doc =
    args.type === 'user'
      ? await User.findById(args.id)
      : await Responder.findById(args.id);
  if (!doc) throw new AppError('Registration not found', 404, 'NOT_FOUND');
  if (doc.approvalStatus === 'approved') {
    throw new AppError('Already approved', 409, 'ALREADY_APPROVED');
  }

  doc.approvalStatus = 'approved';
  doc.isApproved = true;
  doc.approvedAt = new Date();
  doc.approvedBy = adminObjectId;
  doc.rejectedAt = undefined;
  doc.rejectedBy = undefined;
  doc.rejectionReason = undefined;
  await doc.save();

  await AuditLog.create({
    actorId: adminObjectId,
    actorRole: 'admin',
    action: `${args.type}.approved`,
    targetType: args.type,
    targetId: doc._id,
    meta: args.notes ? { notes: args.notes } : undefined,
    requestId: args.admin.requestId,
    ip: args.admin.ip,
    userAgent: args.admin.userAgent,
  });

  return getRegistration(args.id, args.type);
}

export async function rejectRegistration(args: {
  id: string;
  type: AccountType;
  reason: string;
  admin: AdminContext;
}) {
  const adminObjectId = new mongoose.Types.ObjectId(args.admin.adminId);

  const doc =
    args.type === 'user'
      ? await User.findById(args.id)
      : await Responder.findById(args.id);
  if (!doc) throw new AppError('Registration not found', 404, 'NOT_FOUND');
  if (doc.approvalStatus === 'rejected') {
    throw new AppError('Already rejected', 409, 'ALREADY_REJECTED');
  }

  doc.approvalStatus = 'rejected';
  doc.isApproved = false;
  doc.rejectedAt = new Date();
  doc.rejectedBy = adminObjectId;
  doc.rejectionReason = args.reason;
  doc.approvedAt = undefined;
  doc.approvedBy = undefined;
  await doc.save();

  await AuditLog.create({
    actorId: adminObjectId,
    actorRole: 'admin',
    action: `${args.type}.rejected`,
    targetType: args.type,
    targetId: doc._id,
    meta: { reason: args.reason },
    requestId: args.admin.requestId,
    ip: args.admin.ip,
    userAgent: args.admin.userAgent,
  });

  return getRegistration(args.id, args.type);
}
