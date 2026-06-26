import { z } from 'zod';
import { CategorySchema } from './category/category.schema';
import { DeliverySchema } from './delivery.schema';

// Exemple de schema
export const ProductSchema = z.object({
  id: z
    .uuid()
    .describe('L\'identifiant unique de l\'objet'),
  name: z
    .string()
    .min(3, { error: 'Le nom doit contenir minimum 3 caracteres !' })
    .max(50, { error: 'Le nom doit contenir maximum 50 caracteres !' })
    .describe('Le nom du produit'),
  desc: z
    .string()
    .min(10, { error: 'Le description doit contenir minimum 10 caracteres !' })
    .max(1_000, { error: 'Le nom doit contenir maximum 1000 caracteres !' })
    .optional()
    .describe('Le description du produit'),
  price: z
    .number()
    .min(0, { error: 'Le prix doit être positif' })
    .describe('Le prix du produit'),
  stockQuantity: z
    .number({ error: 'Le quantité du stock doit être un nombre' })
    .int({ error: 'Le quantité du stock doit être un entier' })
    .nonnegative({ error: 'Le quantité du stock ne peut pas être negative' })
    .describe('Le stock actuel du produit'),
  releaseDate: z.coerce
    .date({ error: 'La date de sortie doit être valide' })
    .describe('La date de sortie'),
  restockDate: z.coerce
    .date({ error: 'La date de réassort doit être valide' })
    .optional()
    .describe('La date de réassort'),
  stockoutDate: z.coerce
    .date({ error: 'La date de fin de stock doit être valide' })
    .min(new Date('2000-01-01'), { error: 'Date de fin de stock avant 2000' })
    .optional()
    .describe('La date de réassort'),
  isFood: z
    .boolean({ error: 'La valeur "food" doit être un booléen' })
    .describe('Booléen pour de l\'alimentaire'),
  categories: z
    .array(CategorySchema)
    .min(1, { error: 'Une categorie minimum' })
    .describe('Categories du produit'),
  deliveries: z
    .record(z.string(), z.array(DeliverySchema))
    .nullish()
    .describe('Condionnements du produit'),
  tva: z
    .enum(['NORMAL', 'INTERMEDIATE', 'REDUCED', 'ZERO'])
    .describe('Type de TVA'),
  ageRestriction: z
    .enum(['+3', '+8', '+12', '+16', '+18'])
    .optional()
    .describe('Restrictions d\'âge'),
});
