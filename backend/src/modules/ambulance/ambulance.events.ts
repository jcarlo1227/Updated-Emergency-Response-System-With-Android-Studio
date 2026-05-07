import type { Server as SocketServer } from 'socket.io';
import type { Types } from 'mongoose';
import type { IAmbulanceTransportRequest } from '../../models/index.js';
import { recordAmbulanceNotification } from '../notifications/notifications.service.js';

export type AmbulanceEventName =
  | 'ambulance_request.created'
  | 'ambulance_request.reviewed'
  | 'ambulance_request.assigned'
  | 'ambulance_request.on_the_way'
  | 'ambulance_request.arrived_pickup'
  | 'ambulance_request.patient_onboard'
  | 'ambulance_request.completed'
  | 'ambulance_request.cancelled'
  | 'ambulance_availability.updated';

export interface AmbulanceEventPayload {
  requestId: string;
  requestType: IAmbulanceTransportRequest['requestType'];
  status: IAmbulanceTransportRequest['status'];
  senderUserId: string;
  assignedResponderId?: string;
  assignedAmbulanceUnitId?: string;
  isEmergencyPriority: boolean;
  isTanzaCitizenPriority: boolean;
  outsideScopeFlag: boolean;
  occurredAt: string;
}

function buildPayload(req: IAmbulanceTransportRequest): AmbulanceEventPayload {
  return {
    requestId: (req._id as Types.ObjectId).toString(),
    requestType: req.requestType,
    status: req.status,
    senderUserId: req.senderUserId.toString(),
    assignedResponderId: req.assignedResponderId?.toString(),
    assignedAmbulanceUnitId: req.assignedAmbulanceUnitId?.toString(),
    isEmergencyPriority: req.isEmergencyPriority,
    isTanzaCitizenPriority: req.isTanzaCitizenPriority,
    outsideScopeFlag: req.outsideScopeFlag,
    occurredAt: new Date().toISOString(),
  };
}

export function emitAmbulanceEvent(
  io: SocketServer | undefined,
  event: AmbulanceEventName,
  req: IAmbulanceTransportRequest,
): void {
  if (!io) return;
  const payload = buildPayload(req);
  io.to('admin:live').emit(event, payload);
  io.to(`user:${req.senderUserId.toString()}`).emit(event, payload);
  if (req.assignedResponderId) {
    io.to(`responder:${req.assignedResponderId.toString()}`).emit(event, payload);
  }

  void recordAmbulanceNotification(req, event, io);
}
