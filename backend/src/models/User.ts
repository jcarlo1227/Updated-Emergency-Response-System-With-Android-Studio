import mongoose, { Schema, Document } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IEmbeddedContact {
  name: string;
  phone: string;
  isPrimary: boolean;
}

export interface ILocationHistoryPoint {
  type: 'Point';
  coordinates: [number, number];
  accuracyMeters?: number;
  capturedAt: Date;
}

export interface IUser extends Document {
  role: 'user';
  name: string;
  email: string;
  phone: string;
  password: string;
  contacts: mongoose.Types.DocumentArray<IEmbeddedContact & mongoose.Types.Subdocument>;

  isApproved: boolean;
  approvalStatus: ApprovalStatus;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;

  proofOfResidencyFileId?: mongoose.Types.ObjectId;
  faceCaptureFileId?: mongoose.Types.ObjectId;

  municipality?: string;
  barangay?: string;
  streetAddress?: string;

  age?: number;
  dateOfBirth?: Date;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;

  locationHistory: ILocationHistoryPoint[];

  createdAt: Date;
  updatedAt: Date;
}

const embeddedContactSchema = new Schema<IEmbeddedContact>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true },
);

const locationHistoryPointSchema = new Schema<ILocationHistoryPoint>(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
    accuracyMeters: { type: Number, min: 0, max: 5000 },
    capturedAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['user'], default: 'user', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    contacts: { type: [embeddedContactSchema], default: [] },

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

    proofOfResidencyFileId: { type: Schema.Types.ObjectId },
    faceCaptureFileId: { type: Schema.Types.ObjectId },

    municipality: { type: String, trim: true, maxlength: 120 },
    barangay: { type: String, trim: true, maxlength: 120 },
    streetAddress: { type: String, trim: true, maxlength: 250 },

    age: { type: Number, min: 0, max: 150 },
    dateOfBirth: { type: Date },
    bloodType: {
      type: String,
      trim: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    emergencyContactName: { type: String, trim: true, maxlength: 120 },
    emergencyContactNumber: { type: String, trim: true, maxlength: 20 },

    locationHistory: { type: [locationHistoryPointSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ approvalStatus: 1, createdAt: -1 });
userSchema.index({ municipality: 1, barangay: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
