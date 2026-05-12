import { z } from 'zod';
const geoPointSchema = z
    .object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    addressLabel: z.string().trim().min(3).max(250),
    accuracyMeters: z.number().min(0).max(5000).optional(),
})
    .strict();
export const createAmbulanceRequestSchema = z
    .object({
    requestType: z.enum(['emergency', 'schedule', 'transfer']),
    patient: z
        .object({
        fullName: z.string().trim().min(2).max(120),
        address: z.string().trim().min(5).max(250),
        contactNumber: z.string().trim().min(7).max(20),
        medicalCondition: z.string().trim().min(2).max(500),
        specialRequirements: z.string().trim().max(500).optional(),
    })
        .strict(),
    accompanyingPerson: z
        .object({
        fullName: z.string().trim().min(2).max(120),
        contactNumber: z.string().trim().min(7).max(20),
    })
        .strict()
        .optional(),
    pickupLocation: geoPointSchema,
    dropOffLocation: geoPointSchema,
    requestedDate: z.string().date().optional(),
    requestedTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM format required')
        .optional(),
    transferDetails: z
        .object({
        originHospitalName: z.string().trim().max(180).optional(),
        destinationHospitalName: z.string().trim().max(180).optional(),
        referringDoctor: z.string().trim().max(120).optional(),
    })
        .strict()
        .optional(),
    notes: z.string().trim().max(500).optional(),
    isTanzaCitizen: z.boolean().default(false),
    barangay: z.string().trim().max(120).optional(),
})
    .strict()
    .superRefine((val, ctx) => {
    if (val.requestType !== 'emergency') {
        if (!val.requestedDate || !val.requestedTime) {
            ctx.addIssue({
                code: 'custom',
                message: 'requestedDate and requestedTime are required for Schedule and Transfer.',
                path: ['requestedDate'],
            });
        }
        if (val.requestedTime && (val.requestedTime < '15:00' || val.requestedTime > '19:00')) {
            ctx.addIssue({
                code: 'custom',
                message: 'Schedule and Transfer are allowed only from 3:00 PM to 7:00 PM.',
                path: ['requestedTime'],
            });
        }
    }
});
export const idParamSchema = z
    .object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId') })
    .strict();
export const listAdminQuerySchema = z
    .object({
    status: z
        .enum(['pending_review', 'approved', 'rejected', 'assigned', 'completed', 'all'])
        .default('pending_review'),
    requestType: z.enum(['emergency', 'schedule', 'transfer']).optional(),
    includeArchived: z
        .union([z.boolean(), z.enum(['true', 'false'])])
        .transform((v) => v === true || v === 'true')
        .default(false),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
    .strict();
export const listMineQuerySchema = z
    .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
    .strict();
export const approveBodySchema = z
    .object({ notes: z.string().trim().max(500).optional() })
    .strict();
export const rejectBodySchema = z
    .object({ reason: z.string().trim().min(2).max(500) })
    .strict();
export const cancelBodySchema = z
    .object({ reason: z.string().trim().max(500).optional() })
    .strict();
export const assignBodySchema = z
    .object({
    ambulanceUnitId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
    responderId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
    reservedUntilAt: z.string().datetime().optional(),
})
    .strict();
export const availabilityQuerySchema = z
    .object({
    type: z.enum(['schedule', 'transfer']),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
})
    .strict();
export const availableUnitsQuerySchema = z
    .object({
    requestId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
})
    .strict();
export const responderUpdateBodySchema = z
    .object({ note: z.string().trim().max(500).optional() })
    .strict();
