import z from 'zod';

export const DeliverySchema = z.object({
  id: z
    .number()
    .describe('L\'identifiant'),
  name: z
    .string()
    .min(3, { error: 'Le nom doit contenir minimum 3 caracteres !' })
    .max(50, { error: 'Le nom doit contenir maximum 50 caracteres !' })
    .describe('Le nom du conditionnement'),
});
