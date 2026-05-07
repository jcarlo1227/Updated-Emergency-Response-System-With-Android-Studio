import mongoose from 'mongoose';
import type { Server as SocketServer } from 'socket.io';
import { AuditLog, BleDevice, Emergency } from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { tanzaScope } from '../../shared/utils/tanza.js';
import type { AuthContext } from '../../shared/types/http.js';
import { emitEmergencyEvent } from '../emergencies/events.js';
import { priorityFor, snapshotUser } from '../emergencies/emergencies.service.js';
import type {
  BleEventInput,
  FromIotInput,
  PairDeviceInput,
  UnpairBody,
} from './ble.schemas.js';

interface ServiceCtx {
  io?: SocketServer;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export async function pairDevice(input: PairDeviceInput, auth: AuthContext) {
  const existing = await BleDevice.findOne({
    deviceId: input.deviceId,
    pairingStatus: 'paired',
  });
  if (existing && existing.userId.toString() !== auth.accountId) {
    throw new AppError('Device already paired to another account', 409, 'DEVICE_TAKEN');
  }
  if (existing && existing.userId.toString() === auth.accountId) {
    existing.bleServiceUuid = input.bleServiceUuid ?? existing.bleServiceUuid;
    existing.firmwareVersion = input.firmwareVersion ?? existing.firmwareVersion;
    existing.batteryPercent = input.batteryPercent ?? existing.batteryPercent;
    existing.lastSeenAt = new Date();
    await existing.save();
    return existing;
  }
  const device = await BleDevice.create({
    userId: new mongoose.Types.ObjectId(auth.accountId),
    deviceId: input.deviceId,
    bleServiceUuid: input.bleServiceUuid,
    firmwareVersion: input.firmwareVersion,
    batteryPercent: input.batteryPercent,
    pairingStatus: 'paired',
    pairedAt: new Date(),
    lastSeenAt: new Date(),
  });
  return device;
}

export async function listDevices(auth: AuthContext) {
  return BleDevice.find({
    userId: new mongoose.Types.ObjectId(auth.accountId),
    pairingStatus: { $ne: 'revoked' },
  })
    .sort({ pairedAt: -1 })
    .lean();
}

export async function unpairDevice(
  deviceDocId: string,
  body: UnpairBody,
  auth: AuthContext,
) {
  const device = await BleDevice.findById(deviceDocId);
  if (!device) throw new AppError('Device not found', 404, 'NOT_FOUND');
  if (device.userId.toString() !== auth.accountId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  if (device.pairingStatus === 'revoked') {
    throw new AppError('Device already unpaired', 409, 'ALREADY_REVOKED');
  }
  device.pairingStatus = 'revoked';
  device.revokedAt = new Date();
  device.revokedBy = new mongoose.Types.ObjectId(auth.accountId);
  device.revokedReason = body.reason;
  await device.save();
  return device;
}

export async function processBleEvent(input: BleEventInput, auth: AuthContext) {
  const device = await BleDevice.findOne({
    userId: new mongoose.Types.ObjectId(auth.accountId),
    deviceId: input.deviceId,
    pairingStatus: 'paired',
  });
  if (!device) throw new AppError('Device not found or not paired', 404, 'DEVICE_NOT_FOUND');

  device.lastSeenAt = new Date();
  if (input.batteryLevel !== undefined) device.batteryPercent = input.batteryLevel;
  if (input.firmwareVersion) device.firmwareVersion = input.firmwareVersion;
  if (input.switchState) device.switchState = input.switchState;
  if (input.rssi !== undefined) device.lastRssi = input.rssi;
  await device.save();

  return { acknowledged: true, deviceId: input.deviceId, eventId: input.eventId };
}

export async function createFromIot(
  input: FromIotInput,
  auth: AuthContext,
  ctx: ServiceCtx,
) {
  const device = await BleDevice.findOne({
    userId: new mongoose.Types.ObjectId(auth.accountId),
    deviceId: input.deviceId,
    pairingStatus: 'paired',
  });
  if (!device) {
    throw new AppError('Device not found or not paired to your account', 403, 'DEVICE_NOT_PAIRED');
  }

  const idempotencyKey = `iot:${input.deviceId}:${input.eventId}:${auth.accountId}`;
  const duplicate = await Emergency.findOne({ idempotencyKey }).lean();
  if (duplicate) return duplicate;

  const [lng, lat] = input.location.coordinates;
  const scope = tanzaScope(lng, lat);
  const userObjectId = new mongoose.Types.ObjectId(auth.accountId);
  const snapshot = await snapshotUser(auth.accountId);

  const emergency = await Emergency.create({
    type: input.buttonType,
    source: 'iot_keychain',
    priority: priorityFor(input.buttonType),
    status: 'pending',
    userId: userObjectId,
    currentLocation: {
      type: 'Point',
      coordinates: input.location.coordinates,
      accuracyMeters: input.location.accuracyMeters,
      capturedAt: new Date(input.location.capturedAt),
    },
    isInsideTanza: scope.isInsideTanza,
    outsideScopeFlag: scope.outsideScopeFlag,
    barangay: input.barangay,
    municipality: 'Tanza',
    bleEventId: input.eventId,
    sourceDeviceId: input.deviceId,
    buttonType: input.buttonType,
    deviceBatteryAtTrigger: input.deviceBatteryAtTrigger,
    idempotencyKey,
    notes: input.notes,
    userSnapshot: snapshot,
    timeline: [{ event: 'created', at: new Date(), actorId: userObjectId, actorRole: 'user' }],
  });

  device.lastSeenAt = new Date();
  if (input.deviceBatteryAtTrigger !== undefined) {
    device.batteryPercent = input.deviceBatteryAtTrigger;
  }
  await device.save();

  await AuditLog.create({
    actorId: userObjectId,
    actorRole: 'user',
    action: 'emergency.iot_keychain_created',
    targetType: 'emergency',
    targetId: emergency._id,
    meta: {
      deviceId: input.deviceId,
      eventId: input.eventId,
      buttonType: input.buttonType,
      outsideScopeFlag: scope.outsideScopeFlag,
    },
    requestId: ctx.requestId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  emitEmergencyEvent(ctx.io, 'emergency.iot_keychain_created', emergency);
  return emergency;
}
