import { requireArtist } from "@/lib/api-helpers";
import { doTimeRangesOverlap } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const patchSchema = z
  .object({
    startTime: z.string().regex(timeRegex, "Format HH:MM requis"),
    endTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  const { id } = await params;

  const slot = await prisma.weeklySlot.findUnique({ where: { id } });
  if (!slot || slot.artistId !== artist.id) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const otherSlots = await prisma.weeklySlot.findMany({
    where: { artistId: artist.id, day: slot.day, id: { not: id } },
  });
  const hasOverlap = otherSlots.some((s) =>
    doTimeRangesOverlap(parsed.data.startTime, parsed.data.endTime, s.startTime, s.endTime),
  );
  if (hasOverlap) {
    return NextResponse.json(
      { error: "Ce créneau chevauche un créneau déjà existant" },
      { status: 409 },
    );
  }

  const updated = await prisma.weeklySlot.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  const { id } = await params;

  const slot = await prisma.weeklySlot.findUnique({ where: { id } });

  if (!slot || slot.artistId !== artist.id) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  await prisma.weeklySlot.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
