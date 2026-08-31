import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "@/lib/validation/booking-schema";

const validPayload = {
  artistId: "artist-1",
  tattooType: "premier_rdv",
  bodyPart: "Avant-bras",
  size: "moyen",
  description: "Un tatouage floral sur l'avant-bras.",
};

describe("bookingRequestSchema — création de réservation", () => {
  it("accepte une demande valide", () => {
    const result = bookingRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejette une demande sans artistId", () => {
    const { artistId, ...rest } = validPayload;
    void artistId;
    const result = bookingRequestSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejette une description trop courte", () => {
    const result = bookingRequestSchema.safeParse({
      ...validPayload,
      description: "court",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un tattooType hors énumération", () => {
    const result = bookingRequestSchema.safeParse({
      ...validPayload,
      tattooType: "autre",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une taille hors énumération", () => {
    const result = bookingRequestSchema.safeParse({
      ...validPayload,
      size: "gigantesque",
    });
    expect(result.success).toBe(false);
  });

  it("applique un tableau vide par défaut quand referenceUrls est absent", () => {
    const result = bookingRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referenceUrls).toEqual([]);
    }
  });

  it("rejette une referenceUrl qui n'est pas une URL valide", () => {
    const result = bookingRequestSchema.safeParse({
      ...validPayload,
      referenceUrls: ["pas-une-url"],
    });
    expect(result.success).toBe(false);
  });
});
