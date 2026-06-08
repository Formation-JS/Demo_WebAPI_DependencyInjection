import z from 'zod';

export const CategorySchema: z.ZodType<any> = z.object({
  id: z
    .number()
    .describe('L\'identifiant'),
  name: z
    .string()
    .describe('Le nom de la catégorie'),
  subCategories: z
    .array(z.lazy(() => CategorySchema))
    .describe('Sous catégories (Recursive)')
    .optional()
});