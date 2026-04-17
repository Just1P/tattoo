import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const PAGE_SIZE = 30;

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });

  if (!participant) {
    return NextResponse.json(
      { error: "Conversation introuvable" },
      { status: 404 },
    );
  }

  const cursor = req.nextUrl.searchParams.get("cursor");

  if (!cursor) {
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const raw = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  const messages = raw.reverse();
  const hasMore = raw.length === PAGE_SIZE;

  return NextResponse.json({ messages, hasMore });
}

const messageSchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    imageUrl: z.url().optional(),
  })
  .refine((d) => d.content || d.imageUrl, {
    message: "Un message ou une image est requis",
  });

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });

  if (!participant) {
    return NextResponse.json(
      { error: "Conversation introuvable" },
      { status: 404 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        content: parsed.data.content ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
