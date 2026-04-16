import Typography from "@/components/custom/Typography";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageThread } from "@/components/messages/message-thread";
import { auth } from "@/lib/auth";
import { getConversationsForUser } from "@/lib/conversation-queries";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

const PAGE_SIZE = 10;

export default async function ConversationPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });

  if (!participant) notFound();

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const [conversations, raw] = await Promise.all([
    getConversationsForUser(session.user.id),
    // Charge les PAGE_SIZE derniers messages (ordre desc pour la pagination, puis inversé)
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: { sender: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  const messages = raw.reverse();
  const hasMore = raw.length === PAGE_SIZE;

  const initialMessages = messages.map((m) => ({
    id: m.id,
    content: m.content,
    imageUrl: m.imageUrl ?? null,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
    sender: m.sender,
  }));

  const otherConv = conversations.find((c) => c.id === id);
  const other =
    otherConv?.participants.find((u) => u.id !== session.user.id) ?? null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-lg border overflow-hidden">
      <div className="w-72 shrink-0 border-r overflow-y-auto hidden md:block">
        <div className="px-4 py-3 border-b">
          <Typography tag="h2">Messages</Typography>
        </div>
        <ConversationList
          conversations={conversations}
          currentUserId={session.user.id}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <MessageThread
          conversationId={id}
          initialMessages={initialMessages}
          initialHasMore={hasMore}
          currentUserId={session.user.id}
          otherUser={other}
        />
      </div>
    </div>
  );
}
