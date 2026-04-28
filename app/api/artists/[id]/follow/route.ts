import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: artistId } = await params;

  try {
    await prisma.$transaction([
      prisma.artistFollower.create({
        data: { artistId, userId: session.user.id },
      }),
      prisma.tattooArtist.update({
        where: { id: artistId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Vous suivez déjà cet artiste" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: artistId } = await params;

  await prisma.$transaction([
    prisma.artistFollower.deleteMany({
      where: { artistId, userId: session.user.id },
    }),
    prisma.tattooArtist.update({
      where: { id: artistId },
      data: { followersCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
