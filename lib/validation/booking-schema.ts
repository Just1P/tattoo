import { z } from "zod";

export const bookingRequestSchema = z.object({
  artistId: z.string().min(1),
  tattooType: z.enum(["premier_rdv", "remplissage", "retouche"]),
  bodyPart: z.string().trim().min(1, "La zone est requise"),
  size: z.enum(["petit", "moyen", "grand", "tres_grand"]),
  description: z
    .string()
    .trim()
    .min(10, "Décrivez votre projet en quelques mots"),
  referenceUrls: z.array(z.url()).optional().default([]),
});
