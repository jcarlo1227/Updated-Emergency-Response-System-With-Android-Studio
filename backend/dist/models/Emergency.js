import mongoose, { Schema } from 'mongoose';
const timelineEventSchema = new Schema({
    event: { type: String, required: true, trim: true, maxlength: 80 },
    at: { type: Date, required: true, default: Date.now },
    actorId: { type: Schema.Types.ObjectId },
    actorRole: { type: String, enum: ['user', 'responder', 'admin', 'system'] },
    note: { type: String, trim: true, maxlength: 500 },
}, { _id: true });
const userSnapshotSchema = new Schema({
    fullName: { type: String, trim: true, maxlength: 120 },
    age: { type: Number, min: 0, max: 150 },
    faceCaptureFileId: { type: Schema.Types.ObjectId },
    bloodType: { type: String, trim: true, maxlength: 8 },
    emergencyContactName: { type: String, trim: true, maxlength: 120 },
    emergencyContactNumber: { type: String, trim: true, maxlength: 20 },
}, { _id: false });
const emergencySchema = new Schema({
    type: {
        type: String,
        enum: ['medical', 'crime', 'fire', 'general_sos'],
        required: true,
    },
    source: { type: String, enum: ['mobile_app', 'iot_keychain'], required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        required: true,
    },
    status: {
        type: String,
        enum: [
            'pending',
            'assigned',
            'responder_on_the_way',
            'responder_nearby',
            'arrived',
            'resolved',
            'cancelled',
        ],
        default: 'pending',
        required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedResponderId: { type: Schema.Types.ObjectId, ref: 'Responder' },
    currentLocation: {
        type: { type: String, enum: ['Point'], required: true, default: 'Point' },
        coordinates: { type: [Number], required: true },
        accuracyMeters: { type: Number, min: 0, max: 5000 },
        capturedAt: { type: Date, required: true },
    },
    isInsideTanza: { type: Boolean, default: false, required: true },
    barangay: { type: String, trim: true, maxlength: 120 },
    municipality: { type: String, trim: true, maxlength: 120 },
    outsideScopeFlag: { type: Boolean, default: false, required: true },
    bleEventId: { type: String, trim: true, maxlength: 100 },
    sourceDeviceId: { type: String, trim: true, maxlength: 100 },
    buttonType: { type: String, enum: ['medical', 'crime', 'fire', 'general_sos'] },
    deviceBatteryAtTrigger: { type: Number, min: 0, max: 100 },
    idempotencyKey: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500 },
    userSnapshot: { type: userSnapshotSchema },
    timeline: { type: [timelineEventSchema], default: [] },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId },
    cancelledAt: { type: Date },
}, { timestamps: true });
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ userId: 1, createdAt: -1 });
emergencySchema.index({ assignedResponderId: 1, status: 1 });
emergencySchema.index({ source: 1, createdAt: -1 });
emergencySchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
emergencySchema.index({ currentLocation: '2dsphere' });
emergencySchema.index({ outsideScopeFlag: 1, status: 1 });
export const Emergency = mongoose.model('Emergency', emergencySchema);
