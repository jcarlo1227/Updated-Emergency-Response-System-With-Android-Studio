import { z } from 'zod';

export const ingestLocationSchema = z
  .object({
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    accuracyMeters: z.number().min(0).max(5000).optional(),
    capturedAt: z.string().datetime(),
    emergencyId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    ambulanceRequestId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  })
  .strict();
export type IngestLocationInput = z.infer<typeof ingestLocationSchema>;

export const idParamSchema = z
  .object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId') })
  .strict();
export type IdParam = z.infer<typeof idParamSchema>;

export const historyQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(100),
    before: z.string().datetime().optional(),
  })
  .strict();
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
