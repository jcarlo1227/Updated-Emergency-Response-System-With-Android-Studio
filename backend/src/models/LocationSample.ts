import mongoose, { Schema, Document } from 'mongoose';

export type ActorType = 'user' | 'responder';

export interface ILocationSample extends Document {
  emergencyId?: mongoose.Types.ObjectId;
  ambulanceRequestId?: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorType: ActorType;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  accuracyMeters?: number;
  capturedAt: Date;
  createdAt: Date;
}

const locationSampleSchema = new Schema<ILocationSample>(
  {
    emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency', index: true },
    ambulanceRequestId: { type: Schema.Types.ObjectId, ref: 'AmbulanceTransportRequest', index: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    actorType: { type: String, enum: ['user', 'responder'], required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v: number[]) =>
            v.length === 2 &&
            v[0]! >= -180 && v[0]! <= 180 &&
            v[1]! >= -90 && v[1]! <= 90,
          message: 'coordinates must be [lng, lat] within valid ranges',
        },
      },
    },
    accuracyMeters: { type: Number, min: 0, max: 5000 },
    capturedAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

locationSampleSchema.index({ actorId: 1, actorType: 1, capturedAt: -1 });
locationSampleSchema.index({ emergencyId: 1, capturedAt: 1 });
locationSampleSchema.index({ location: '2dsphere' });

export const LocationSample = mongoose.model<ILocationSample>('LocationSample', locationSampleSchema);
