import { z } from 'zod';

export const emailSchema = z.string().email('Email non valida');

export const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, 'Numero di telefono non valido');

export const passwordSchema = z
  .string()
  .min(8, 'La password deve avere almeno 8 caratteri')
  .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
  .regex(/[0-9]/, 'La password deve contenere almeno un numero');

export const userCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).default('STAFF'),
});

export const clientRequestSchema = z.object({
  clientPhone: phoneSchema,
  clientName: z.string().min(2, 'Il nome del cliente deve avere almeno 2 caratteri'),
  content: z.string().min(5, 'Il contenuto deve avere almeno 5 caratteri'),
  requestType: z.enum(['QUOTE', 'BOOKING', 'SUPPORT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const financialDataSchema = z.object({
  date: z.coerce.date(),
  totalCash: z.number().min(0, 'Il cash non può essere negativo'),
  budgetAllocated: z.number().min(0),
  budgetUsed: z.number().min(0),
  projectedRevenue: z.number().min(0),
  notes: z.string().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type ClientRequestInput = z.infer<typeof clientRequestSchema>;
export type FinancialDataInput = z.infer<typeof financialDataSchema>;
