import mongoose, { Schema } from 'mongoose';
const refreshTokenSchema = new Schema({
    jti: { type: String, required: true, unique: true, index: true, maxlength: 80 },
    tokenHash: { type: String, required: true, unique: true, maxlength: 128 },
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, enum: ['user', 'responder', 'admin'], required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String, maxlength: 80 },
    ip: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 250 },
}, { timestamps: { createdAt: true, updatedAt: false } });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
