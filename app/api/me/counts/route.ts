import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const [unreadMessages, unreadNotifications] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: { participants: { some: { userId: session.user.id } } },
        senderId: { not: session.user.id },
        readAt: null,
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({ unreadMessages, unreadNotifications });
}
