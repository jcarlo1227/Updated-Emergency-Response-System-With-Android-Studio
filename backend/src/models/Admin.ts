import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 120 },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
