import { auth } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
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

  const artist = await prisma.tattooArtist.findUnique({
    where: { id: artistId },
    select: { userId: true },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  if (artist.userId === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même" }, { status: 403 });
  }

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

    await prisma.notification.create({
      data: {
        userId: artist.userId,
        type: "new_follower",
        payload: {
          followerId: session.user.id,
          followerName: session.user.name ?? "Un utilisateur",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Vous suivez déjà cet artiste" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: artistId } = await params;

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.artistFollower.deleteMany({
      where: { artistId, userId: session.user.id },
    });
    if (count > 0) {
      await tx.tattooArtist.update({
        where: { id: artistId },
        data: { followersCount: { decrement: 1 } },
      });
    }
  });

  return NextResponse.json({ success: true });
}
