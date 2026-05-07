import mongoose, { Schema } from 'mongoose';
const auditLogSchema = new Schema({
    actorId: { type: Schema.Types.ObjectId, index: true },
    actorRole: {
        type: String,
        enum: ['user', 'responder', 'admin', 'system'],
        required: true,
    },
    action: { type: String, required: true, trim: true, maxlength: 120, index: true },
    targetType: { type: String, trim: true, maxlength: 80 },
    targetId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
    requestId: { type: String, trim: true, maxlength: 120 },
    ip: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 250 },
}, { timestamps: { createdAt: true, updatedAt: false } });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
