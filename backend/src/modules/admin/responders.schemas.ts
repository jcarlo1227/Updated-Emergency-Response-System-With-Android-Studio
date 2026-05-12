import { z } from 'zod';

export const RESPONDER_ROLES = [
  'medic',
  'fire_responder',
  'police_responder',
  'ambulance_driver',
  'disaster_response',
  'general_responder',
] as const;

export const DUTY_STATUSES = [
  'available',
  'busy',
  'responding',
  'inactive',
  'unavailable',
  'offline',
  'suspended',
] as const;

export const createResponderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  phone: z.string().trim().min(7).max(20),
  streetAddress: z.string().trim().min(2).max(250),
  dateOfBirth: z.coerce.date().refine((d) => {
    const now = new Date();
    if (d.getTime() > now.getTime()) return false;
    const age = now.getFullYear() - d.getFullYear();
    return age >= 18 && age <= 100;
  }, 'Responder must be 18–100 years old'),
  responderRole: z.enum(RESPONDER_ROLES),
  assignedAmbulanceUnitId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid unit id')
    .optional(),
  dutyStatus: z.enum(DUTY_STATUSES).default('available'),
});

export type CreateResponderInput = z.infer<typeof createResponderSchema>;
