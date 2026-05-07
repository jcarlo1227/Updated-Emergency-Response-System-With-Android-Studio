import mongoose, { Schema, Document } from 'mongoose';
import type { ApprovalStatus, ILocationHistoryPoint } from './User.js';

export type AgencyType = 'mdrrmo' | 'pnp' | 'bfp' | 'medical' | 'rescue' | 'barangay' | 'other';
export type DutyStatus =
  | 'off_duty'
  | 'on_duty'
  | 'busy'
  | 'available'
  | 'offline'
  | 'suspended';

export type ResponderRole =
  | 'medic'
  | 'fire_responder'
  | 'police_responder'
  | 'ambulance_driver'
  | 'disaster_response'
  | 'general_responder';

export interface IResponder extends Document {
  role: 'responder';
  name: string;
  email: string;
  password: string;
  phone?: string;
  streetAddress?: string;
  dateOfBirth?: Date;
  age?: number;
  responderRole?: ResponderRole;
  assignedAmbulanceUnitId?: mongoose.Types.ObjectId;

  badgeId: string;
  department: 'police' | 'medical' | 'fire' | 'rescue' | 'barangay';
  isOnDuty: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };

  agencyType?: AgencyType;
  stationName?: string;
  position?: string;
  coverageArea?: string;

  isApproved: boolean;
  approvalStatus: ApprovalStatus;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;

  credentialFileId?: mongoose.Types.ObjectId;
  faceCaptureFileId?: mongoose.Types.ObjectId;

  dutyStatus: DutyStatus;

  locationHistory: ILocationHistoryPoint[];

  createdAt: Date;
  updatedAt: Date;
}

const locationHistoryPointSchema = new Schema<ILocationHistoryPoint>(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
    accuracyMeters: { type: Number, min: 0, max: 5000 },
    capturedAt: { type: Date, required: true },
  },
  { _id: false },
);

const responderSchema = new Schema<IResponder>(
  {
    role: { type: String, enum: ['responder'], default: 'responder', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true, maxlength: 20 },
    streetAddress: { type: String, trim: true, maxlength: 250 },
    dateOfBirth: { type: Date },
    age: { type: Number, min: 0, max: 150 },
    responderRole: {
      type: String,
      enum: [
        'medic',
        'fire_responder',
        'police_responder',
        'ambulance_driver',
        'disaster_response',
        'general_responder',
      ],
    },
    assignedAmbulanceUnitId: { type: Schema.Types.ObjectId, ref: 'AmbulanceUnit' },

    badgeId: { type: String, required: true, unique: true, trim: true },
    department: {
      type: String,
      required: true,
      enum: ['police', 'medical', 'fire', 'rescue', 'barangay'],
    },
    isOnDuty: { type: Boolean, default: false },
    currentLocation: {
      latitude: Number,
      longitude: Number,
    },

    agencyType: {
      type: String,
      enum: ['mdrrmo', 'pnp', 'bfp', 'medical', 'rescue', 'barangay', 'other'],
    },
    stationName: { type: String, trim: true, maxlength: 180 },
    position: { type: String, trim: true, maxlength: 120 },
    coverageArea: { type: String, trim: true, maxlength: 180 },

    isApproved: { type: Boolean, default: false, required: true },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId },
    rejectionReason: { type: String, trim: true, maxlength: 500 },

    credentialFileId: { type: Schema.Types.ObjectId },
    faceCaptureFileId: { type: Schema.Types.ObjectId },

    dutyStatus: {
      type: String,
      enum: [
        'off_duty',
        'on_duty',
        'busy',
        'available',
        'offline',
        'suspended',
      ],
      default: 'off_duty',
      required: true,
    },

    locationHistory: { type: [locationHistoryPointSchema], default: [] },
  },
  { timestamps: true },
);

responderSchema.index({ approvalStatus: 1, createdAt: -1 });
responderSchema.index({ agencyType: 1, dutyStatus: 1 });

export const Responder = mongoose.model<IResponder>('Responder', responderSchema);
