import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  verified: z.enum(["approved", "rejected", "pending"]),
  verificationNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { verified, verificationNote } = parsed.data;

  try {
    const artist = await prisma.tattooArtist.update({
      where: { id },
      data: { verified, verificationNote: verificationNote ?? null },
      include: { user: { select: { email: true, name: true } } },
    });
    return NextResponse.json(artist);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }
    throw e;
  }
}
