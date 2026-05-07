import { describe, it, expect } from 'vitest';
import { createAmbulanceRequestSchema } from '../src/modules/ambulance/ambulance.schemas.js';
import { createEmergencySchema } from '../src/modules/emergencies/emergencies.schemas.js';
import { loginSchema, registerUserSchema } from '../src/modules/auth/auth.schemas.js';

// ─── Ambulance schemas ────────────────────────────────────────────────────────

describe('createAmbulanceRequestSchema', () => {
  const baseSchedule = {
    requestType: 'schedule' as const,
    patient: {
      fullName: 'Juan Dela Cruz',
      address: 'Brgy Amaya, Tanza',
      contactNumber: '09171234567',
      medicalCondition: 'Broken leg',
    },
    pickupLocation: { type: 'Point' as const, coordinates: [120.885, 14.355] as [number, number], addressLabel: 'Amaya Tanza' },
    dropOffLocation: { type: 'Point' as const, coordinates: [120.87, 14.38] as [number, number], addressLabel: 'Hospital' },
    requestedDate: '2026-05-10',
    requestedTime: '15:00',
  };

  it('accepts a valid Schedule request at 15:00', () => {
    const result = createAmbulanceRequestSchema.safeParse(baseSchedule);
    expect(result.success).toBe(true);
  });

  it('accepts a valid Schedule request at 19:00', () => {
    const result = createAmbulanceRequestSchema.safeParse({ ...baseSchedule, requestedTime: '19:00' });
    expect(result.success).toBe(true);
  });

  it('rejects Schedule request at 10:00 (outside 15:00–19:00 window)', () => {
    const result = createAmbulanceRequestSchema.safeParse({ ...baseSchedule, requestedTime: '10:00' });
    expect(result.success).toBe(false);
  });

  it('rejects Schedule request at 20:00 (after window)', () => {
    const result = createAmbulanceRequestSchema.safeParse({ ...baseSchedule, requestedTime: '20:00' });
    expect(result.success).toBe(false);
  });

  it('rejects Schedule request with no requestedDate', () => {
    const { requestedDate: _, ...rest } = baseSchedule;
    const result = createAmbulanceRequestSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts Emergency request without requestedDate and requestedTime', () => {
    const payload = {
      requestType: 'emergency' as const,
      patient: baseSchedule.patient,
      pickupLocation: baseSchedule.pickupLocation,
      dropOffLocation: baseSchedule.dropOffLocation,
    };
    const result = createAmbulanceRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('Emergency request bypasses time window (no time needed)', () => {
    const payload = {
      requestType: 'emergency' as const,
      patient: baseSchedule.patient,
      pickupLocation: baseSchedule.pickupLocation,
      dropOffLocation: baseSchedule.dropOffLocation,
      requestedTime: '10:00',
    };
    const result = createAmbulanceRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ─── Emergency schemas ────────────────────────────────────────────────────────

describe('createEmergencySchema', () => {
  const baseEmergency = {
    type: 'medical' as const,
    location: {
      type: 'Point' as const,
      coordinates: [120.885, 14.355] as [number, number],
      capturedAt: '2026-05-07T00:00:00Z',
    },
  };

  it('accepts a valid medical emergency', () => {
    expect(createEmergencySchema.safeParse(baseEmergency).success).toBe(true);
  });

  it('accepts all 4 emergency types', () => {
    for (const type of ['medical', 'crime', 'fire', 'general_sos'] as const) {
      const result = createEmergencySchema.safeParse({ ...baseEmergency, type });
      expect(result.success, `type ${type} should be valid`).toBe(true);
    }
  });

  it('rejects an invalid emergency type', () => {
    expect(createEmergencySchema.safeParse({ ...baseEmergency, type: 'tornado' }).success).toBe(false);
  });

  it('rejects coordinates out of range', () => {
    const bad = { ...baseEmergency, location: { ...baseEmergency.location, coordinates: [200, 14.355] as [number, number] } };
    expect(createEmergencySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects missing capturedAt', () => {
    const bad = { ...baseEmergency, location: { type: 'Point' as const, coordinates: [120.885, 14.355] as [number, number] } };
    expect(createEmergencySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown extra fields (strict mode)', () => {
    const bad = { ...baseEmergency, unknownField: 'injected' };
    expect(createEmergencySchema.safeParse(bad).success).toBe(false);
  });
});

// ─── Auth schemas ─────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: 'password123' }).success).toBe(true);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'notanemail', password: 'password123' }).success).toBe(false);
  });

  it('rejects unknown fields (strict mode)', () => {
    expect(loginSchema.safeParse({ email: 'u@t.com', password: 'pass1234', role: 'hacker' }).success).toBe(false);
  });
});

describe('registerUserSchema', () => {
  const base = {
    name: 'Juan Dela Cruz',
    email: 'juan@test.com',
    phone: '+63917000001',
    password: 'password123',
    streetAddress: '123 Sampaguita St., Brgy Amaya',
    dateOfBirth: '1990-04-12T00:00:00Z',
    bloodType: 'O+' as const,
    emergencyContactName: 'Maria Dela Cruz',
    emergencyContactNumber: '+63917000002',
  };

  it('accepts a complete v1.1 registration', () => {
    const result = registerUserSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(registerUserSchema.safeParse({ ...base, password: 'short' }).success).toBe(false);
  });

  it('rejects name shorter than 2 chars', () => {
    expect(registerUserSchema.safeParse({ ...base, name: 'A' }).success).toBe(false);
  });

  it('rejects missing dateOfBirth', () => {
    const { dateOfBirth: _, ...rest } = base;
    expect(registerUserSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects future dateOfBirth', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(registerUserSchema.safeParse({ ...base, dateOfBirth: future }).success).toBe(false);
  });

  it('rejects invalid blood type', () => {
    expect(registerUserSchema.safeParse({ ...base, bloodType: 'O' }).success).toBe(false);
  });

  it('rejects missing emergency contact name', () => {
    const { emergencyContactName: _, ...rest } = base;
    expect(registerUserSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing street address', () => {
    const { streetAddress: _, ...rest } = base;
    expect(registerUserSchema.safeParse(rest).success).toBe(false);
  });
});
