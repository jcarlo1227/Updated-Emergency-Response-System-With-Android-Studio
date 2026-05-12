import { describe, expect, it } from 'vitest';
import {
  canResponderHandleEmergency,
  emergencyTypesForResponder,
} from '../src/modules/emergencies/responderRoleAccess.js';

describe('responder role emergency access', () => {
  it('maps medical responders to medical emergencies', () => {
    expect(
      emergencyTypesForResponder({
        responderRole: 'medic',
        department: 'medical',
      }),
    ).toContain('medical');
    expect(
      canResponderHandleEmergency(
        { responderRole: 'medic', department: 'medical' },
        'fire',
      ),
    ).toBe(false);
  });

  it('maps fire and police roles to their matching incident types', () => {
    expect(
      canResponderHandleEmergency(
        { responderRole: 'fire_responder', department: 'fire' },
        'fire',
      ),
    ).toBe(true);
    expect(
      canResponderHandleEmergency(
        { responderRole: 'police_responder', department: 'police' },
        'crime',
      ),
    ).toBe(true);
  });

  it('maps rescue and general responders to general SOS emergencies', () => {
    expect(
      canResponderHandleEmergency(
        { responderRole: 'disaster_response', department: 'rescue' },
        'general_sos',
      ),
    ).toBe(true);
  });
});
