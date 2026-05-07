import mongoose from 'mongoose';
import type { Server as SocketServer } from 'socket.io';
import {
  Emergency,
  LocationSample,
  Responder,
  User,
} from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import type { AuthContext } from '../../shared/types/http.js';
import type { HistoryQuery, IngestLocationInput } from './locations.schemas.js';

interface ServiceCtx {
  io?: SocketServer;
  requestId?: string;
}

export async function ingestUserLocation(
  input: IngestLocationInput,
  auth: AuthContext,
  ctx: ServiceCtx,
) {
  const sample = await LocationSample.create({
    actorId: new mongoose.Types.ObjectId(auth.accountId),
    actorType: 'user',
    location: { type: 'Point', coordinates: input.coordinates },
    accuracyMeters: input.accuracyMeters,
    capturedAt: new Date(input.capturedAt),
    emergencyId: input.emergencyId
      ? new mongoose.Types.ObjectId(input.emergencyId)
      : undefined,
    ambulanceRequestId: input.ambulanceRequestId
      ? new mongoose.Types.ObjectId(input.ambulanceRequestId)
      : undefined,
  });

  await User.findByIdAndUpdate(auth.accountId, {
    $push: {
      locationHistory: {
        $each: [
          {
            type: 'Point',
            coordinates: input.coordinates,
            accuracyMeters: input.accuracyMeters,
            capturedAt: new Date(input.capturedAt),
          },
        ],
        $slice: -100,
      },
    },
  });

  ctx.io?.to(`user:${auth.accountId}`).emit('location.user_updated', {
    userId: auth.accountId,
    coordinates: input.coordinates,
    accuracyMeters: input.accuracyMeters,
    capturedAt: input.capturedAt,
    emergencyId: input.emergencyId,
  });

  if (input.emergencyId) {
    ctx.io?.to(`emergency:${input.emergencyId}`).emit('location.user_updated', {
      userId: auth.accountId,
      coordinates: input.coordinates,
      capturedAt: input.capturedAt,
    });
  }

  return sample;
}

export async function ingestResponderLocation(
  input: IngestLocationInput,
  auth: AuthContext,
  ctx: ServiceCtx,
) {
  const sample = await LocationSample.create({
    actorId: new mongoose.Types.ObjectId(auth.accountId),
    actorType: 'responder',
    location: { type: 'Point', coordinates: input.coordinates },
    accuracyMeters: input.accuracyMeters,
    capturedAt: new Date(input.capturedAt),
    emergencyId: input.emergencyId
      ? new mongoose.Types.ObjectId(input.emergencyId)
      : undefined,
    ambulanceRequestId: input.ambulanceRequestId
      ? new mongoose.Types.ObjectId(input.ambulanceRequestId)
      : undefined,
  });

  await Responder.findByIdAndUpdate(auth.accountId, {
    $set: {
      currentLocation: {
        latitude: input.coordinates[1],
        longitude: input.coordinates[0],
      },
    },
    $push: {
      locationHistory: {
        $each: [
          {
            type: 'Point',
            coordinates: input.coordinates,
            accuracyMeters: input.accuracyMeters,
            capturedAt: new Date(input.capturedAt),
          },
        ],
        $slice: -100,
      },
    },
  });

  ctx.io?.to('admin:live').emit('location.responder_updated', {
    responderId: auth.accountId,
    coordinates: input.coordinates,
    accuracyMeters: input.accuracyMeters,
    capturedAt: input.capturedAt,
    emergencyId: input.emergencyId,
  });

  if (input.emergencyId) {
    ctx.io?.to(`emergency:${input.emergencyId}`).emit('location.responder_updated', {
      responderId: auth.accountId,
      coordinates: input.coordinates,
      capturedAt: input.capturedAt,
    });
    ctx.io?.to(`user:${auth.accountId}`).emit('location.responder_updated', {
      responderId: auth.accountId,
      coordinates: input.coordinates,
      capturedAt: input.capturedAt,
    });
  }

  return sample;
}

export async function getEmergencyLocationHistory(
  emergencyId: string,
  query: HistoryQuery,
  auth: AuthContext,
) {
  const emergency = await Emergency.findById(emergencyId).lean();
  if (!emergency) throw new AppError('Emergency not found', 404, 'NOT_FOUND');

  if (auth.role === 'user' && emergency.userId.toString() !== auth.accountId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  if (
    auth.role === 'responder' &&
    emergency.assignedResponderId?.toString() !== auth.accountId
  ) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const filter: Record<string, unknown> = {
    emergencyId: new mongoose.Types.ObjectId(emergencyId),
  };
  if (query.before) filter.capturedAt = { $lt: new Date(query.before) };

  return LocationSample.find(filter)
    .sort({ capturedAt: -1 })
    .limit(query.limit)
    .lean();
}

export async function getAmbulanceLocationHistory(
  requestId: string,
  query: HistoryQuery,
  auth: AuthContext,
) {
  const filter: Record<string, unknown> = {
    ambulanceRequestId: new mongoose.Types.ObjectId(requestId),
  };
  if (query.before) filter.capturedAt = { $lt: new Date(query.before) };
  if (auth.role === 'user') filter.actorType = 'responder';

  return LocationSample.find(filter)
    .sort({ capturedAt: -1 })
    .limit(query.limit)
    .lean();
}

export async function getRespondersLive() {
  const responders = await Responder.find({
    isApproved: true,
    dutyStatus: { $in: ['on_duty', 'busy'] },
    currentLocation: { $exists: true },
  })
    .select('_id name agencyType dutyStatus currentLocation locationHistory')
    .lean();

  return responders.map((r) => ({
    responderId: r._id,
    name: r.name,
    agencyType: r.agencyType,
    dutyStatus: r.dutyStatus,
    currentLocation: r.currentLocation,
    lastSeen: (r.locationHistory as Array<{ capturedAt: Date }>).at(-1)?.capturedAt,
  }));
}
