import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TattooArtist } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type ErrorResult = { ok: false; response: NextResponse };
type RoleSuccess = { ok: true; session: Session };
type ArtistSuccess = { ok: true; session: Session; artist: TattooArtist };

export async function requireArtistRole(): Promise<ErrorResult | RoleSuccess> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  if (session.user.role !== "artist") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès interdit" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

export async function requireAdmin(): Promise<ErrorResult | RoleSuccess> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  if (session.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès interdit" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

export async function requireArtist(): Promise<ErrorResult | ArtistSuccess> {
  const check = await requireArtistRole();
  if (!check.ok) return check;

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: check.session.user.id },
  });
  if (!artist) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Profil artiste introuvable" },
        { status: 404 },
      ),
    };
  }
  return { ok: true, session: check.session, artist };
}
