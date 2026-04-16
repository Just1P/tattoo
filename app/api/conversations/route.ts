import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// GET — liste des conversations de l'utilisateur connecté
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Compte les messages non lus par conversation
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversation: { participants: { some: { userId: session.user.id } } },
      senderId: { not: session.user.id },
      readAt: null,
    },
    _count: { id: true },
  });

  const unreadMap = Object.fromEntries(
    unreadCounts.map((r) => [r.conversationId, r._count.id])
  );

  const result = conversations.map((c) => ({
    id: c.id,
    updatedAt: c.updatedAt,
    lastMessage: c.messages[0] ?? null,
    unreadCount: unreadMap[c.id] ?? 0,
    participants: c.participants.map((p) => p.user),
  }));

  return NextResponse.json(result);
}

// POST — créer ou retrouver une conversation avec un autre utilisateur
const createSchema = z.object({
  recipientId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }

  const { recipientId } = parsed.data;

  if (recipientId === session.user.id) {
    return NextResponse.json({ error: "Impossible de vous écrire à vous-même" }, { status: 400 });
  }

  // Cherche une conversation existante entre ces deux utilisateurs
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: recipientId } } },
      ],
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id, created: false });
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: session.user.id }, { userId: recipientId }],
      },
    },
  });

  return NextResponse.json({ id: conversation.id, created: true }, { status: 201 });
}
