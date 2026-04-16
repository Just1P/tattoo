import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookingRequestSchema = z.object({
  artistId: z.string().min(1),
  tattooType: z.enum(["premier_rdv", "remplissage", "retouche"]),
  bodyPart: z.string().trim().min(1, "La zone est requise"),
  size: z.enum(["petit", "moyen", "grand", "tres_grand"]),
  description: z.string().trim().min(10, "Décrivez votre projet en quelques mots"),
  referenceUrls: z.array(z.string().url()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const artist = await prisma.tattooArtist.findUnique({
    where: { id: parsed.data.artistId },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  // Un artiste ne peut pas se réserver lui-même
  if (artist.userId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas faire une demande à vous-même" },
      { status: 403 }
    );
  }

  // Empêche une demande en doublon si une est déjà pending
  const existing = await prisma.booking.findFirst({
    where: {
      artistId: artist.id,
      userId: session.user.id,
      status: "pending",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà une demande en attente auprès de cet artiste" },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      artistId: artist.id,
      userId: session.user.id,
      tattooType: parsed.data.tattooType,
      bodyPart: parsed.data.bodyPart,
      size: parsed.data.size,
      description: parsed.data.description,
      referenceUrls: parsed.data.referenceUrls,
      status: "pending",
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
