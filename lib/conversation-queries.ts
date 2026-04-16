import { prisma } from "@/lib/prisma";

export async function getConversationsForUser(userId: string) {
  const [conversations, unreadCounts] = await Promise.all([
    prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversation: { participants: { some: { userId } } },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { id: true },
    }),
  ]);

  const unreadMap = Object.fromEntries(
    unreadCounts.map((r) => [r.conversationId, r._count.id])
  );

  return conversations.map((c) => ({
    id: c.id,
    updatedAt: c.updatedAt.toISOString(),
    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content,
          createdAt: c.messages[0].createdAt.toISOString(),
          senderId: c.messages[0].senderId,
        }
      : null,
    unreadCount: unreadMap[c.id] ?? 0,
    participants: c.participants.map((p) => p.user),
  }));
}
