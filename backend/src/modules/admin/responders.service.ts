import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AmbulanceUnit, AuditLog, Responder } from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import type { CreateResponderInput } from './responders.schemas.js';

const SALT_ROUNDS = 10;

const ROLE_TO_DEPARTMENT: Record<CreateResponderInput['responderRole'], 'police' | 'medical' | 'fire' | 'rescue' | 'barangay'> = {
  medic: 'medical',
  fire_responder: 'fire',
  police_responder: 'police',
  ambulance_driver: 'medical',
  disaster_response: 'rescue',
  general_responder: 'rescue',
};

function ageFromDob(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function generateBadgeId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ADM-${ts}-${rand}`;
}

interface AdminContext {
  adminId: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export async function listAmbulanceUnits() {
  return AmbulanceUnit.find()
    .select('unitNumber unitName plateNumber availabilityStatus assignedResponderId')
    .sort({ unitNumber: 1 })
    .lean();
}

export async function createResponder(
  input: CreateResponderInput,
  admin: AdminContext,
) {
  const existingByEmail = await Responder.findOne({ email: input.email });
  if (existingByEmail) {
    throw new AppError(
      'A responder with this email already exists',
      409,
      'EMAIL_TAKEN',
    );
  }
  if (input.phone) {
    const existingByPhone = await Responder.findOne({ phone: input.phone });
    if (existingByPhone) {
      throw new AppError(
        'A responder with this phone number already exists',
        409,
        'PHONE_TAKEN',
      );
    }
  }

  let assignedUnit: mongoose.Types.ObjectId | undefined;
  if (input.assignedAmbulanceUnitId) {
    const unit = await AmbulanceUnit.findById(input.assignedAmbulanceUnitId);
    if (!unit) {
      throw new AppError('Ambulance unit not found', 404, 'UNIT_NOT_FOUND');
    }
    assignedUnit = unit._id as mongoose.Types.ObjectId;
  }

  const dob = input.dateOfBirth instanceof Date
    ? input.dateOfBirth
    : new Date(input.dateOfBirth);
  const age = ageFromDob(dob);
  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const adminObjectId = new mongoose.Types.ObjectId(admin.adminId);

  let responder;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      responder = await Responder.create({
        name: input.name,
        email: input.email,
        password: hashed,
        phone: input.phone,
        streetAddress: input.streetAddress,
        dateOfBirth: dob,
        age,
        responderRole: input.responderRole,
        assignedAmbulanceUnitId: assignedUnit,
        badgeId: generateBadgeId(),
        department: ROLE_TO_DEPARTMENT[input.responderRole],
        dutyStatus: input.dutyStatus,
        isApproved: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: adminObjectId,
        isOnDuty: input.dutyStatus === 'available' || input.dutyStatus === 'busy',
      });
      break;
    } catch (err) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code?: number }).code === 11000 &&
        attempt < 2
      ) {
        continue;
      }
      throw err;
    }
  }
  if (!responder) {
    throw new AppError('Failed to generate badge id', 500, 'INTERNAL_ERROR');
  }

  await AuditLog.create({
    actorId: adminObjectId,
    actorRole: 'admin',
    action: 'responder.created_by_admin',
    targetType: 'responder',
    targetId: responder._id,
    meta: {
      responderRole: input.responderRole,
      assignedAmbulanceUnitId: assignedUnit?.toString(),
    },
    requestId: admin.requestId,
    ip: admin.ip,
    userAgent: admin.userAgent,
  });

  return Responder.findById(responder._id).select('-password').lean();
}
