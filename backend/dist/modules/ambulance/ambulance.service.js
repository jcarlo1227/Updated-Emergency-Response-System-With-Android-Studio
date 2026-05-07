import mongoose from 'mongoose';
import { AmbulanceTransportRequest, AmbulanceUnit, AuditLog, Responder, User, } from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { tanzaScope } from '../../shared/utils/tanza.js';
import { emitAmbulanceEvent } from './ambulance.events.js';
function audit(args) {
    return AuditLog.create({
        actorId: new mongoose.Types.ObjectId(args.actorId),
        actorRole: args.actorRole,
        action: args.action,
        targetType: 'ambulance_request',
        targetId: args.targetId,
        meta: args.meta,
        requestId: args.ctx.requestId,
        ip: args.ctx.ip,
        userAgent: args.ctx.userAgent,
    });
}
function parseDatetime(date, time) {
    return new Date(`${date}T${time}:00`);
}
function windowEnd(date) {
    return new Date(`${date}T19:00:00`);
}
export async function getAvailableUnits(args) {
    const busyFilter = {
        status: { $in: ['assigned', 'on_the_way', 'arrived_pickup', 'patient_onboard'] },
        reservedFromAt: { $lt: args.endAt },
        reservedUntilAt: { $gt: args.startAt },
        assignedAmbulanceUnitId: { $exists: true, $ne: null },
    };
    if (args.excludeRequestId) {
        busyFilter._id = { $ne: new mongoose.Types.ObjectId(args.excludeRequestId) };
    }
    const busyUnitIds = await AmbulanceTransportRequest.distinct('assignedAmbulanceUnitId', busyFilter);
    return AmbulanceUnit.find({
        availabilityStatus: { $nin: ['maintenance', 'out_of_service'] },
        _id: { $nin: busyUnitIds },
    })
        .sort({ unitNumber: 1 })
        .lean();
}
export async function checkAvailability(query) {
    const startAt = new Date(query.startAt);
    const endAt = new Date(query.endAt);
    const units = await getAvailableUnits({ startAt, endAt });
    return { available: units.length > 0, units };
}
export async function createRequest(input, auth, ctx) {
    if (auth.role !== 'user') {
        throw new AppError('Only users can create transport requests', 403, 'FORBIDDEN');
    }
    const user = await User.findById(auth.accountId).lean();
    if (!user)
        throw new AppError('User not found', 404, 'NOT_FOUND');
    if (!user.isApproved)
        throw new AppError('Account not approved', 403, 'ACCOUNT_NOT_APPROVED');
    const [pickupLng, pickupLat] = input.pickupLocation.coordinates;
    const scope = tanzaScope(pickupLng, pickupLat);
    const isEmergencyPriority = input.requestType === 'emergency';
    const isTanzaCitizenPriority = input.isTanzaCitizen || (input.barangay ? scope.isInsideTanza : false);
    const senderSnapshot = {
        fullName: user.name,
        age: user.age,
        dateOfBirth: user.dateOfBirth,
        bloodType: user.bloodType,
        faceCaptureFileId: user.faceCaptureFileId,
        proofOfResidencyFileId: user.proofOfResidencyFileId,
        municipality: user.municipality ?? 'Tanza',
        barangay: input.barangay ?? user.barangay,
    };
    const created = await AmbulanceTransportRequest.create({
        requestType: input.requestType,
        status: 'pending_review',
        senderUserId: new mongoose.Types.ObjectId(auth.accountId),
        senderSnapshot,
        patient: input.patient,
        accompanyingPerson: input.accompanyingPerson,
        pickupLocation: {
            type: 'Point',
            coordinates: input.pickupLocation.coordinates,
            addressLabel: input.pickupLocation.addressLabel,
            accuracyMeters: input.pickupLocation.accuracyMeters,
        },
        dropOffLocation: {
            type: 'Point',
            coordinates: input.dropOffLocation.coordinates,
            addressLabel: input.dropOffLocation.addressLabel,
            accuracyMeters: input.dropOffLocation.accuracyMeters,
        },
        requestedDate: input.requestedDate ? new Date(input.requestedDate) : undefined,
        requestedTime: input.requestedTime,
        transferDetails: input.transferDetails,
        notes: input.notes,
        isEmergencyPriority,
        isTanzaCitizenPriority,
        requiresImmediateReview: isEmergencyPriority,
        outsideScopeFlag: scope.outsideScopeFlag,
        timeline: [{ event: 'created', at: new Date(), actorId: user._id, actorRole: 'user' }],
    });
    await audit({
        actorId: auth.accountId,
        actorRole: 'user',
        action: 'ambulance_request.created',
        targetId: created._id,
        meta: { requestType: input.requestType, outsideScopeFlag: scope.outsideScopeFlag },
        ctx,
    });
    emitAmbulanceEvent(ctx.io, 'ambulance_request.created', created);
    return created;
}
export async function listMine(args, auth) {
    if (auth.role !== 'user')
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
    const filter = { senderUserId: new mongoose.Types.ObjectId(auth.accountId) };
    const skip = (args.page - 1) * args.limit;
    const [items, total] = await Promise.all([
        AmbulanceTransportRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(args.limit)
            .lean(),
        AmbulanceTransportRequest.countDocuments(filter),
    ]);
    return { items, total, page: args.page, limit: args.limit };
}
export async function getOne(id, auth) {
    const doc = await AmbulanceTransportRequest.findById(id).lean();
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (auth.role === 'user' && doc.senderUserId.toString() !== auth.accountId) {
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
    if (auth.role === 'responder' &&
        doc.assignedResponderId?.toString() !== auth.accountId) {
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
    return doc;
}
export async function cancel(id, body, auth, ctx) {
    if (auth.role !== 'user')
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
    const doc = await AmbulanceTransportRequest.findById(id);
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (doc.senderUserId.toString() !== auth.accountId) {
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
    if (doc.status !== 'pending_review') {
        throw new AppError('Cannot cancel after review begins', 409, 'INVALID_TRANSITION');
    }
    doc.status = 'cancelled';
    doc.timeline.push({
        event: 'cancelled',
        at: new Date(),
        actorId: new mongoose.Types.ObjectId(auth.accountId),
        actorRole: 'user',
        note: body.reason,
    });
    await doc.save();
    await audit({
        actorId: auth.accountId,
        actorRole: 'user',
        action: 'ambulance_request.cancelled',
        targetId: doc._id,
        meta: body.reason ? { reason: body.reason } : undefined,
        ctx,
    });
    emitAmbulanceEvent(ctx.io, 'ambulance_request.cancelled', doc);
    return doc;
}
export async function listAdmin(args) {
    const filter = args.status === 'all' ? {} : { status: args.status };
    if (args.requestType)
        filter.requestType = args.requestType;
    const skip = (args.page - 1) * args.limit;
    const [items, total] = await Promise.all([
        AmbulanceTransportRequest.find(filter)
            .sort({ isEmergencyPriority: -1, createdAt: -1 })
            .skip(skip)
            .limit(args.limit)
            .lean(),
        AmbulanceTransportRequest.countDocuments(filter),
    ]);
    return { items, total, page: args.page, limit: args.limit };
}
export async function approve(id, notes, auth, ctx) {
    const doc = await AmbulanceTransportRequest.findById(id);
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (doc.status !== 'pending_review') {
        throw new AppError('Only pending_review requests can be approved', 409, 'INVALID_TRANSITION');
    }
    doc.status = 'approved';
    doc.reviewedAt = new Date();
    doc.reviewedBy = new mongoose.Types.ObjectId(auth.accountId);
    doc.approvalNotes = notes;
    doc.timeline.push({
        event: 'approved',
        at: new Date(),
        actorId: new mongoose.Types.ObjectId(auth.accountId),
        actorRole: 'admin',
        note: notes,
    });
    await doc.save();
    await audit({
        actorId: auth.accountId,
        actorRole: 'admin',
        action: 'ambulance_request.approved',
        targetId: doc._id,
        meta: notes ? { notes } : undefined,
        ctx,
    });
    emitAmbulanceEvent(ctx.io, 'ambulance_request.reviewed', doc);
    return doc;
}
export async function reject(id, reason, auth, ctx) {
    const doc = await AmbulanceTransportRequest.findById(id);
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (doc.status !== 'pending_review') {
        throw new AppError('Only pending_review requests can be rejected', 409, 'INVALID_TRANSITION');
    }
    doc.status = 'rejected';
    doc.reviewedAt = new Date();
    doc.reviewedBy = new mongoose.Types.ObjectId(auth.accountId);
    doc.rejectionReason = reason;
    doc.timeline.push({
        event: 'rejected',
        at: new Date(),
        actorId: new mongoose.Types.ObjectId(auth.accountId),
        actorRole: 'admin',
        note: reason,
    });
    await doc.save();
    await audit({
        actorId: auth.accountId,
        actorRole: 'admin',
        action: 'ambulance_request.rejected',
        targetId: doc._id,
        meta: { reason },
        ctx,
    });
    emitAmbulanceEvent(ctx.io, 'ambulance_request.reviewed', doc);
    return doc;
}
export async function assign(id, body, auth, ctx) {
    const doc = await AmbulanceTransportRequest.findById(id);
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (doc.status !== 'approved') {
        throw new AppError('Only approved requests can be assigned', 409, 'INVALID_TRANSITION');
    }
    const unit = await AmbulanceUnit.findById(body.ambulanceUnitId);
    if (!unit)
        throw new AppError('Ambulance unit not found', 404, 'NOT_FOUND');
    if (['maintenance', 'out_of_service'].includes(unit.availabilityStatus)) {
        throw new AppError('Unit is not available', 409, 'UNIT_UNAVAILABLE');
    }
    const responder = await Responder.findById(body.responderId);
    if (!responder)
        throw new AppError('Responder not found', 404, 'NOT_FOUND');
    if (!responder.isApproved) {
        throw new AppError('Responder not approved', 409, 'RESPONDER_NOT_APPROVED');
    }
    let reservedFrom;
    let reservedUntil;
    if (doc.requestType === 'emergency') {
        reservedFrom = new Date();
        reservedUntil = body.reservedUntilAt ? new Date(body.reservedUntilAt) : new Date(Date.now() + 4 * 60 * 60 * 1000);
    }
    else {
        const dateStr = doc.requestedDate
            ? doc.requestedDate.toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
        reservedFrom = parseDatetime(dateStr, doc.requestedTime ?? '15:00');
        reservedUntil = body.reservedUntilAt ? new Date(body.reservedUntilAt) : windowEnd(dateStr);
    }
    const conflicts = await getAvailableUnits({
        startAt: reservedFrom,
        endAt: reservedUntil,
        excludeRequestId: id,
    });
    const unitAvailable = conflicts.some((u) => u._id.toString() === body.ambulanceUnitId);
    if (!unitAvailable) {
        throw new AppError('Unit has a conflicting reservation for this time range', 409, 'UNIT_CONFLICT');
    }
    doc.status = 'assigned';
    doc.assignedAmbulanceUnitId = unit._id;
    doc.assignedResponderId = responder._id;
    doc.assignedAt = new Date();
    doc.reservedFromAt = reservedFrom;
    doc.reservedUntilAt = reservedUntil;
    doc.timeline.push({
        event: 'assigned',
        at: new Date(),
        actorId: new mongoose.Types.ObjectId(auth.accountId),
        actorRole: 'admin',
    });
    await doc.save();
    unit.availabilityStatus = 'assigned';
    unit.assignedResponderId = responder._id;
    unit.activeRequestId = doc._id;
    unit.assignmentStartAt = reservedFrom;
    unit.assignmentEndAt = reservedUntil;
    await unit.save();
    await audit({
        actorId: auth.accountId,
        actorRole: 'admin',
        action: 'ambulance_request.assigned',
        targetId: doc._id,
        meta: { unitNumber: unit.unitNumber, responderId: body.responderId },
        ctx,
    });
    emitAmbulanceEvent(ctx.io, 'ambulance_request.assigned', doc);
    return doc;
}
async function responderTransition(id, targetStatus, fromStatus, eventName, body, auth, ctx) {
    const doc = await AmbulanceTransportRequest.findById(id);
    if (!doc)
        throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (doc.assignedResponderId?.toString() !== auth.accountId) {
        throw new AppError('Not your assignment', 403, 'FORBIDDEN');
    }
    if (doc.status !== fromStatus) {
        throw new AppError(`Must be in '${fromStatus}' state`, 409, 'INVALID_TRANSITION');
    }
    doc.status = targetStatus;
    doc.timeline.push({
        event: targetStatus,
        at: new Date(),
        actorId: new mongoose.Types.ObjectId(auth.accountId),
        actorRole: 'responder',
        note: body.note,
    });
    await doc.save();
    if (targetStatus === 'completed' && doc.assignedAmbulanceUnitId) {
        await AmbulanceUnit.findByIdAndUpdate(doc.assignedAmbulanceUnitId, {
            availabilityStatus: 'available',
            $unset: {
                assignedResponderId: 1,
                activeRequestId: 1,
                assignmentStartAt: 1,
                assignmentEndAt: 1,
            },
        });
        ctx.io?.to('admin:live').emit('ambulance_availability.updated', {
            unitId: doc.assignedAmbulanceUnitId.toString(),
            status: 'available',
            occurredAt: new Date().toISOString(),
        });
    }
    await audit({
        actorId: auth.accountId,
        actorRole: 'responder',
        action: `ambulance_request.${targetStatus}`,
        targetId: doc._id,
        ctx,
    });
    emitAmbulanceEvent(ctx.io, eventName, doc);
    return doc;
}
export async function listResponderAssigned(auth) {
    return AmbulanceTransportRequest.find({
        assignedResponderId: new mongoose.Types.ObjectId(auth.accountId),
        status: { $in: ['assigned', 'on_the_way', 'arrived_pickup', 'patient_onboard'] },
    })
        .sort({ isEmergencyPriority: -1, assignedAt: -1 })
        .lean();
}
export const setOnTheWay = (id, body, auth, ctx) => responderTransition(id, 'on_the_way', 'assigned', 'ambulance_request.on_the_way', body, auth, ctx);
export const setArrivedPickup = (id, body, auth, ctx) => responderTransition(id, 'arrived_pickup', 'on_the_way', 'ambulance_request.arrived_pickup', body, auth, ctx);
export const setPatientOnboard = (id, body, auth, ctx) => responderTransition(id, 'patient_onboard', 'arrived_pickup', 'ambulance_request.patient_onboard', body, auth, ctx);
export const complete = (id, body, auth, ctx) => responderTransition(id, 'completed', 'patient_onboard', 'ambulance_request.completed', body, auth, ctx);
export async function getAvailableUnitsForAdmin(query) {
    let startAt = query.startAt ? new Date(query.startAt) : new Date();
    let endAt = query.endAt ? new Date(query.endAt) : new Date(startAt.getTime() + 4 * 60 * 60 * 1000);
    if (query.requestId) {
        const doc = await AmbulanceTransportRequest.findById(query.requestId).lean();
        if (doc?.requestedDate && doc?.requestedTime) {
            const dateStr = doc.requestedDate.toISOString().slice(0, 10);
            startAt = parseDatetime(dateStr, doc.requestedTime);
            endAt = windowEnd(dateStr);
        }
    }
    return getAvailableUnits({ startAt, endAt, excludeRequestId: query.requestId });
}
