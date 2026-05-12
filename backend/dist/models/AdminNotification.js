import mongoose, { Schema } from 'mongoose';
const adminNotificationSchema = new Schema({
    type: {
        type: String,
        enum: ['emergency', 'ambulance', 'system'],
        required: true,
    },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    requestId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    priority: {
        type: String,
        enum: ['normal', 'high', 'critical'],
        default: 'normal',
        required: true,
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'acknowledged'],
        default: 'unread',
        required: true,
    },
    senderName: { type: String, trim: true, maxlength: 120 },
    emergencyType: { type: String, trim: true, maxlength: 40 },
    location: {
        address: { type: String, trim: true, maxlength: 250 },
        latitude: Number,
        longitude: Number,
    },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    acknowledgedAt: { type: Date },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
}, { timestamps: true });
adminNotificationSchema.index({ status: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });
export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
