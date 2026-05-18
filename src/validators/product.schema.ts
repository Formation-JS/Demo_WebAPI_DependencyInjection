import { z } from "zod";

// Exemple de schema
export const productSchema = z.object({
  id: z.uuid()
    .describe("L'identifiant unique de l'objet"),
  name: z.string()
    .min(3, { error: 'Le nom doit contenir minimum 3 caracteres !' })
    .max(50, { error: 'Le nom doit contenir maximum 50 caracteres !' })
    .describe("Le nom du produit"),
  price: z.number()
    .min(0, { error: 'Le prix doit être positif'})
    .describe("Le prix du produit")
});
 