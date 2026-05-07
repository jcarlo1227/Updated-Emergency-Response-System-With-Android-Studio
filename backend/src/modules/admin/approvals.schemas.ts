import { z } from 'zod';

export const accountTypeSchema = z.enum(['user', 'responder']);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const approvalStatusFilterSchema = z.enum(['pending', 'approved', 'rejected']);

export const listRegistrationsQuerySchema = z
  .object({
    type: accountTypeSchema,
    status: approvalStatusFilterSchema.default('pending'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;

export const idParamSchema = z
  .object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
  })
  .strict();

export type IdParam = z.infer<typeof idParamSchema>;

export const typeQuerySchema = z
  .object({
    type: accountTypeSchema,
  })
  .strict();

export type TypeQuery = z.infer<typeof typeQuerySchema>;

export const approveBodySchema = z
  .object({
    type: accountTypeSchema,
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type ApproveBody = z.infer<typeof approveBodySchema>;

export const rejectBodySchema = z
  .object({
    type: accountTypeSchema,
    reason: z.string().trim().min(2).max(500),
  })
  .strict();

export type RejectBody = z.infer<typeof rejectBodySchema>;
