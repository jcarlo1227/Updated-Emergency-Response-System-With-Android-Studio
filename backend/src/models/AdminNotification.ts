import mongoose, { Schema, Document } from 'mongoose';

export type AdminNotificationType = 'emergency' | 'ambulance' | 'system';
export type AdminNotificationPriority = 'normal' | 'high' | 'critical';
export type AdminNotificationStatus = 'unread' | 'read' | 'acknowledged';

export interface IAdminNotification extends Document {
  type: AdminNotificationType;
  category: string;
  requestId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  priority: AdminNotificationPriority;
  status: AdminNotificationStatus;
  senderName?: string;
  emergencyType?: string;
  location?: { address?: string; latitude?: number; longitude?: number };
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
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
  },
  { timestamps: true },
);

adminNotificationSchema.index({ status: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

export const AdminNotification = mongoose.model<IAdminNotification>(
  'AdminNotification',
  adminNotificationSchema,
);
