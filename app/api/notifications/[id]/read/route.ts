import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function PATCH(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
