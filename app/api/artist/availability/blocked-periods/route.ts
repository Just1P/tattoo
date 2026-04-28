import { requireArtist } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
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
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = blockedPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);

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
      { status: 409 },
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
