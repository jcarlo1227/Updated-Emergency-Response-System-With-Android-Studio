import { z } from 'zod';
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const registerUserSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(7).max(20),
    password: z.string().min(8).max(200),
    municipality: z.string().trim().max(120).optional(),
    barangay: z.string().trim().max(120).optional(),
    streetAddress: z.string().trim().min(2).max(250),
    dateOfBirth: z.coerce.date().refine((d) => {
        const now = new Date();
        if (d.getTime() > now.getTime())
            return false;
        const age = now.getFullYear() - d.getFullYear();
        return age >= 0 && age <= 150;
    }, 'Invalid date of birth'),
    bloodType: z.enum(BLOOD_TYPES),
    emergencyContactName: z.string().trim().min(2).max(120),
    emergencyContactNumber: z.string().trim().min(7).max(20),
});
export const registerResponderSchema = z
    .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(8).max(200),
    badgeId: z.string().trim().min(2).max(80),
    department: z.enum(['police', 'medical', 'fire', 'rescue', 'barangay']),
    agencyType: z
        .enum(['mdrrmo', 'pnp', 'bfp', 'medical', 'rescue', 'barangay', 'other'])
        .optional(),
    stationName: z.string().trim().max(180).optional(),
    position: z.string().trim().max(120).optional(),
    coverageArea: z.string().trim().max(180).optional(),
})
    .strict();
export const loginSchema = z
    .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(200),
    role: z.enum(['user', 'responder', 'admin']).optional(),
})
    .strict();
export const refreshSchema = z
    .object({
    refreshToken: z.string().min(20).max(2000),
})
    .strict();
export const logoutSchema = z
    .object({
    refreshToken: z.string().min(20).max(2000).optional(),
})
    .strict();
export const changePasswordSchema = z
    .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
})
    .strict();
