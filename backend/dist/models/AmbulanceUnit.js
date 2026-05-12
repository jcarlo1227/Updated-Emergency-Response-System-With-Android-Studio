import mongoose, { Schema } from 'mongoose';
const ambulanceUnitSchema = new Schema({
    unitNumber: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 12,
    },
    unitName: { type: String, trim: true, maxlength: 80 },
    plateNumber: { type: String, trim: true, maxlength: 20, uppercase: true },
    unitType: {
        type: String,
        enum: ['bls', 'als', 'patient_transport', 'rescue', 'other'],
    },
    availabilityStatus: {
        type: String,
        enum: ['available', 'assigned', 'maintenance', 'out_of_service'],
        default: 'available',
        required: true,
    },
    assignedResponderId: { type: Schema.Types.ObjectId, ref: 'Responder' },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'Responder' },
    currentAssignmentId: { type: Schema.Types.ObjectId },
    activeRequestId: { type: Schema.Types.ObjectId, ref: 'AmbulanceTransportRequest' },
    latestLocation: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] },
        capturedAt: { type: Date },
    },
    assignmentStartAt: { type: Date },
    assignmentEndAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });
ambulanceUnitSchema.index({ availabilityStatus: 1 });
ambulanceUnitSchema.index({ assignmentStartAt: 1, assignmentEndAt: 1 });
ambulanceUnitSchema.index({ activeRequestId: 1 });
ambulanceUnitSchema.index({ latestLocation: '2dsphere' });
export const AmbulanceUnit = mongoose.model('AmbulanceUnit', ambulanceUnitSchema);
