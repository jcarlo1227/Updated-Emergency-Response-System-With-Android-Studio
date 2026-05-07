function buildPayload(req) {
    return {
        requestId: req._id.toString(),
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
export function emitAmbulanceEvent(io, event, req) {
    if (!io)
        return;
    const payload = buildPayload(req);
    io.to('admin:live').emit(event, payload);
    io.to(`user:${req.senderUserId.toString()}`).emit(event, payload);
    if (req.assignedResponderId) {
        io.to(`responder:${req.assignedResponderId.toString()}`).emit(event, payload);
    }
}
