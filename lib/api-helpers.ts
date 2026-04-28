import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type GuardError = { ok: false; response: NextResponse };

export async function requireArtistRole() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  if (session.user.role !== "artist") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Accès interdit" }, { status: 403 }),
    };
  }
  return { ok: true as const, session };
}

export async function requireArtist() {
  const check = await requireArtistRole();
  if (!check.ok) return check as GuardError;

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: check.session.user.id },
  });
  if (!artist) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Profil artiste introuvable" },
        { status: 404 },
      ),
    };
  }
  return { ok: true as const, session: check.session, artist };
}
