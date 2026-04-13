import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const tattooSchema = z.object({
  imageUrl: z.string().url("URL image invalide"),
  styleId: z.string().min(1, "Le style est requis"),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
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
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = tattooSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json(
      { error: "Profil artiste introuvable" },
      { status: 404 },
    );
  }

  const { imageUrl, styleId, title, description } = parsed.data;

  const lastTattoo = await prisma.tattoo.findFirst({
    where: { artistId: artist.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPosition = (lastTattoo?.position ?? -1) + 1;

  const tattoo = await prisma.tattoo.create({
    data: {
      artistId: artist.id,
      imageUrl,
      styleId,
      title: title || null,
      description: description || null,
      position: nextPosition,
    },
  });

  return NextResponse.json({ tattoo }, { status: 201 });
}
