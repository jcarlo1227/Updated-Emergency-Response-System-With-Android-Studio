const ROLE_EMERGENCY_TYPES = {
    medic: ['medical'],
    ambulance_driver: ['medical'],
    fire_responder: ['fire'],
    police_responder: ['crime'],
    disaster_response: ['general_sos'],
    general_responder: ['general_sos'],
};
const DEPARTMENT_EMERGENCY_TYPES = {
    medical: ['medical'],
    fire: ['fire'],
    police: ['crime'],
    rescue: ['general_sos'],
    barangay: ['general_sos'],
};
const AGENCY_EMERGENCY_TYPES = {
    medical: ['medical'],
    bfp: ['fire'],
    pnp: ['crime'],
    rescue: ['general_sos'],
    mdrrmo: ['general_sos'],
    barangay: ['general_sos'],
};
function uniqueTypes(values) {
    return [...new Set(values)];
}
export function emergencyTypesForResponder(responder) {
    const types = [];
    if (responder.responderRole) {
        types.push(...ROLE_EMERGENCY_TYPES[responder.responderRole]);
    }
    if (responder.department) {
        types.push(...(DEPARTMENT_EMERGENCY_TYPES[responder.department] ?? []));
    }
    if (responder.agencyType) {
        types.push(...(AGENCY_EMERGENCY_TYPES[responder.agencyType] ?? []));
    }
    return uniqueTypes(types);
}
export function canResponderHandleEmergency(responder, emergencyType) {
    return emergencyTypesForResponder(responder).includes(emergencyType);
}
