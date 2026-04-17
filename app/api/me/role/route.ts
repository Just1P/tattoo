import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  role: z.enum(["client", "artist"]),
});

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

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

  const { role } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role, roleSelected: true },
  });

  if (role === "artist") {
    await prisma.tattooArtist.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });
  }

  return NextResponse.json({ success: true });
}
