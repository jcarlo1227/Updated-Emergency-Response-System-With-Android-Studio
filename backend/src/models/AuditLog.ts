import mongoose, { Schema, Document } from 'mongoose';

export type AuditActorRole = 'user' | 'responder' | 'admin' | 'system';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  actorRole: AuditActorRole;
  action: string;
  module?: string;
  description?: string;
  reason?: string;
  severity?: AuditSeverity;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId;
  meta?: Record<string, unknown>;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, index: true },
    actorName: { type: String, trim: true, maxlength: 120 },
    actorRole: {
      type: String,
      enum: ['user', 'responder', 'admin', 'system'],
      required: true,
    },
    action: { type: String, required: true, trim: true, maxlength: 120, index: true },
    module: { type: String, trim: true, maxlength: 60, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    reason: { type: String, trim: true, maxlength: 500 },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
    targetType: { type: String, trim: true, maxlength: 80 },
    targetId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
    requestId: { type: String, trim: true, maxlength: 120 },
    ip: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 250 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
