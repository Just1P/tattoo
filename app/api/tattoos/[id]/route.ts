import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const emptyToNull = z.string().trim().transform((v) => v || null);

const patchSchema = z.object({
  title: emptyToNull.optional(),
  description: emptyToNull.optional(),
  styleId: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

async function getArtistAndTattoo(userId: string, tattooId: string) {
  const artist = await prisma.tattooArtist.findUnique({
    where: { userId },
  });
  if (!artist) return { artist: null, tattoo: null };

  const tattoo = await prisma.tattoo.findUnique({
    where: { id: tattooId },
  });
  if (!tattoo || tattoo.artistId !== artist.id) return { artist, tattoo: null };

  return { artist, tattoo };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "artist")
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const { artist, tattoo } = await getArtistAndTattoo(session.user.id, id);
  if (!artist)
    return NextResponse.json(
      { error: "Profil artiste introuvable" },
      { status: 404 },
    );
  if (!tattoo)
    return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 });

  const { position, ...rest } = parsed.data;

  if (position !== undefined && position !== tattoo.position) {
    await prisma.$transaction(async (tx) => {
      const oldPos = tattoo.position;
      const newPos = position;

      if (newPos > oldPos) {
        await tx.tattoo.updateMany({
          where: {
            artistId: artist.id,
            position: { gt: oldPos, lte: newPos },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        await tx.tattoo.updateMany({
          where: {
            artistId: artist.id,
            position: { gte: newPos, lt: oldPos },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.tattoo.update({
        where: { id },
        data: { ...rest, position: newPos },
      });
    });
  } else {
    await prisma.tattoo.update({ where: { id }, data: rest });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "artist")
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const { id } = await params;

  const { tattoo } = await getArtistAndTattoo(session.user.id, id);
  if (!tattoo)
    return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 });

  await prisma.tattoo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
