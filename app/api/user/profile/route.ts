import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const userSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  description: z.string().trim().transform((v) => v || null).optional().nullable(),
  avatarUrl: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const { protocol, hostname } = new URL(url);
          return (
            protocol === "https:" &&
            (hostname === "utfs.io" ||
              hostname.endsWith(".ufs.sh") ||
              hostname === "lh3.googleusercontent.com")
          );
        } catch {
          return false;
        }
      },
      { message: "Domaine d'image non autorisé" },
    )
    .optional()
    .nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      description: parsed.data.description ?? null,
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
