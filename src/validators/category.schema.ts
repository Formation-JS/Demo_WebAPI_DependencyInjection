import z from 'zod';

export const CategorySchema = z.object({
  id: z
    .number()
    .describe('L\'identifiant'),
  name: z
    .string()
    .describe('Le nom de la catégorie'),
});
