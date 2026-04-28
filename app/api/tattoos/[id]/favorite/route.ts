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

  const { id: tattooId } = await params;

  try {
    await prisma.favoriteTattoo.create({
      data: { tattooId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Tatouage déjà en favoris" }, { status: 409 });
      }
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Tatouage introuvable" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: tattooId } = await params;

  await prisma.favoriteTattoo.deleteMany({
    where: { tattooId, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
