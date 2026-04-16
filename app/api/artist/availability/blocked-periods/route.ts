import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const blockedPeriodSchema = z
  .object({
    label: z.string().trim().optional(),
    startDate: z.string().datetime({ message: "Date de début invalide" }),
    endDate: z.string().datetime({ message: "Date de fin invalide" }),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
  });

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = blockedPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json({ error: "Profil artiste introuvable" }, { status: 404 });
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);

  // Vérifie s'il existe déjà une période qui chevauche celle-ci
  const overlap = await prisma.blockedPeriod.findFirst({
    where: {
      artistId: artist.id,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  if (overlap) {
    return NextResponse.json(
      { error: "Cette période chevauche une période déjà bloquée" },
      { status: 409 }
    );
  }

  const period = await prisma.blockedPeriod.create({
    data: {
      artistId: artist.id,
      label: parsed.data.label,
      startDate: start,
      endDate: end,
    },
  });

  return NextResponse.json(period, { status: 201 });
}
