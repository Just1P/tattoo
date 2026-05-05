import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { verified, verificationNote } = body as {
    verified: "approved" | "rejected" | "pending";
    verificationNote?: string;
  };

  if (!["approved", "rejected", "pending"].includes(verified)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const artist = await prisma.tattooArtist.update({
    where: { id },
    data: { verified, verificationNote: verificationNote ?? null },
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json(artist);
}
