function docId(emergency) {
    return emergency._id.toString();
}
function buildPayload(emergency) {
    return {
        emergencyId: docId(emergency),
        status: emergency.status,
        type: emergency.type,
        source: emergency.source,
        priority: emergency.priority,
        userId: emergency.userId.toString(),
        assignedResponderId: emergency.assignedResponderId?.toString(),
        isInsideTanza: emergency.isInsideTanza,
        outsideScopeFlag: emergency.outsideScopeFlag,
        barangay: emergency.barangay,
        location: emergency.currentLocation,
        userSnapshot: emergency.userSnapshot,
        occurredAt: new Date().toISOString(),
    };
}
export function emitEmergencyEvent(io, event, emergency, extraRooms = []) {
    if (!io)
        return;
    const payload = buildPayload(emergency);
    const userRoom = `user:${emergency.userId.toString()}`;
    const adminRoom = 'admin:live';
    const emergencyRoom = `emergency:${docId(emergency)}`;
    io.to(adminRoom).emit(event, payload);
    io.to(userRoom).emit(event, payload);
    io.to(emergencyRoom).emit(event, payload);
    if (emergency.assignedResponderId) {
        io.to(`responder:${emergency.assignedResponderId.toString()}`).emit(event, payload);
    }
    for (const room of extraRooms) {
        io.to(room).emit(event, payload);
    }
}
