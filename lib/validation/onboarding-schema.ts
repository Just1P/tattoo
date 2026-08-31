import { z } from "zod";

export const onboardingSchema = z.object({
  artistName: z.string().trim().min(1, "Le nom artistique est requis"),
  bio: z.string().trim().optional(),
  city: z.string().trim().min(1, "La ville est requise"),
  location: z.string().trim().optional(),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  styleIds: z.array(z.string()).min(1, "Sélectionnez au moins un style"),
});
