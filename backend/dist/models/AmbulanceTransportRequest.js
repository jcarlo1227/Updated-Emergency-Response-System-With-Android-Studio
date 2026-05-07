import mongoose, { Schema } from 'mongoose';
const geoLocationLabeledSchema = new Schema({
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
    addressLabel: { type: String, required: true, trim: true, minlength: 3, maxlength: 250 },
    accuracyMeters: { type: Number, min: 0, max: 5000 },
}, { _id: false });
const patientSchema = new Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    contactNumber: { type: String, required: true, trim: true, maxlength: 20 },
    medicalCondition: { type: String, required: true, trim: true, maxlength: 500 },
    specialRequirements: { type: String, trim: true, maxlength: 500 },
}, { _id: false });
const accompanyingPersonSchema = new Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    contactNumber: { type: String, required: true, trim: true, maxlength: 20 },
}, { _id: false });
const transferDetailsSchema = new Schema({
    originHospitalName: { type: String, trim: true, maxlength: 180 },
    destinationHospitalName: { type: String, trim: true, maxlength: 180 },
    referringDoctor: { type: String, trim: true, maxlength: 120 },
}, { _id: false });
const senderSnapshotSchema = new Schema({
    fullName: { type: String, trim: true, maxlength: 120 },
    age: { type: Number, min: 0, max: 150 },
    dateOfBirth: { type: Date },
    bloodType: { type: String, trim: true, maxlength: 8 },
    proofOfIndigencyFileId: { type: Schema.Types.ObjectId },
    validIdFileId: { type: Schema.Types.ObjectId },
    faceCaptureFileId: { type: Schema.Types.ObjectId },
    proofOfResidencyFileId: { type: Schema.Types.ObjectId },
    municipality: { type: String, trim: true, maxlength: 120 },
    barangay: { type: String, trim: true, maxlength: 120 },
}, { _id: false });
const ambulanceTimelineSchema = new Schema({
    event: { type: String, required: true, trim: true, maxlength: 80 },
    at: { type: Date, required: true, default: Date.now },
    actorId: { type: Schema.Types.ObjectId },
    actorRole: { type: String, enum: ['user', 'responder', 'admin', 'system'] },
    note: { type: String, trim: true, maxlength: 500 },
}, { _id: true });
const ambulanceTransportRequestSchema = new Schema({
    requestType: { type: String, enum: ['emergency', 'schedule', 'transfer'], required: true },
    status: {
        type: String,
        enum: [
            'pending_review',
            'approved',
            'rejected',
            'assigned',
            'on_the_way',
            'arrived_pickup',
            'patient_onboard',
            'completed',
            'cancelled',
        ],
        default: 'pending_review',
        required: true,
    },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderSnapshot: { type: senderSnapshotSchema, default: {} },
    patient: { type: patientSchema, required: true },
    accompanyingPerson: { type: accompanyingPersonSchema },
    pickupLocation: { type: geoLocationLabeledSchema, required: true },
    dropOffLocation: { type: geoLocationLabeledSchema, required: true },
    requestedDate: { type: Date },
    requestedTime: { type: String, trim: true, maxlength: 5 },
    estimatedPickupDurationMin: { type: Number, min: 0, max: 1440 },
    estimatedTransportDurationMin: { type: Number, min: 0, max: 1440 },
    transferDetails: { type: transferDetailsSchema },
    notes: { type: String, trim: true, maxlength: 500 },
    isEmergencyPriority: { type: Boolean, default: false, required: true },
    isTanzaCitizenPriority: { type: Boolean, default: false, required: true },
    requiresImmediateReview: { type: Boolean, default: false, required: true },
    outsideScopeFlag: { type: Boolean, default: false, required: true },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    approvalNotes: { type: String, trim: true, maxlength: 500 },
    priorityDecision: { type: String, trim: true, maxlength: 120 },
    assignedAmbulanceUnitId: { type: Schema.Types.ObjectId, ref: 'AmbulanceUnit' },
    assignedResponderId: { type: Schema.Types.ObjectId, ref: 'Responder' },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'Responder' },
    assignedAt: { type: Date },
    reservedFromAt: { type: Date },
    reservedUntilAt: { type: Date },
    timeline: { type: [ambulanceTimelineSchema], default: [] },
}, { timestamps: true });
ambulanceTransportRequestSchema.index({ status: 1, createdAt: -1 });
ambulanceTransportRequestSchema.index({ senderUserId: 1, createdAt: -1 });
ambulanceTransportRequestSchema.index({ assignedAmbulanceUnitId: 1, status: 1 });
ambulanceTransportRequestSchema.index({ assignedResponderId: 1, status: 1 });
ambulanceTransportRequestSchema.index({ requestType: 1, status: 1 });
ambulanceTransportRequestSchema.index({ reservedFromAt: 1, reservedUntilAt: 1 });
ambulanceTransportRequestSchema.index({ pickupLocation: '2dsphere' });
ambulanceTransportRequestSchema.index({ dropOffLocation: '2dsphere' });
export const AmbulanceTransportRequest = mongoose.model('AmbulanceTransportRequest', ambulanceTransportRequestSchema);
