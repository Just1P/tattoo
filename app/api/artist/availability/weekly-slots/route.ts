import { requireArtist } from "@/lib/api-helpers";
import { doTimeRangesOverlap } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const weeklySlotSchema = z
  .object({
    day: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string().regex(timeRegex, "Format HH:MM requis"),
    endTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

export async function POST(req: NextRequest) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = weeklySlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const existingSlots = await prisma.weeklySlot.findMany({
    where: { artistId: artist.id, day: parsed.data.day },
  });
  const hasOverlap = existingSlots.some((slot) =>
    doTimeRangesOverlap(
      parsed.data.startTime,
      parsed.data.endTime,
      slot.startTime,
      slot.endTime,
    ),
  );
  if (hasOverlap) {
    return NextResponse.json(
      { error: "Ce créneau chevauche un créneau déjà existant" },
      { status: 409 },
    );
  }

  try {
    const slot = await prisma.weeklySlot.create({
      data: { artistId: artist.id, ...parsed.data },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ce créneau existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
