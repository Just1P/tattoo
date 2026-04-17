import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

const POLL_INTERVAL_MS = 2000;
const KEEPALIVE_INTERVAL_MS = 25000;

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Non authentifié", { status: 401 });
  }

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });

  if (!participant) {
    return new Response("Conversation introuvable", { status: 404 });
  }

  const afterId = req.nextUrl.searchParams.get("afterId");

  let afterDate: Date | null = null;
  if (afterId) {
    const ref = await prisma.message.findFirst({
      where: { id: afterId, conversationId: id },
      select: { createdAt: true },
    });
    afterDate = ref?.createdAt ?? null;
  }

  const encoder = new TextEncoder();

  function send(
    stream: ReadableStreamDefaultController,
    event: string,
    data: unknown,
  ) {
    stream.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    );
  }

  const readable = new ReadableStream({
    async start(controller) {
      let closed = false;

      req.signal.addEventListener("abort", () => {
        closed = true;
        try {
          controller.close();
        } catch {
          /* déjà fermé */
        }
      });

      let lastDate = afterDate ?? new Date();
      let lastId = afterId ?? null;

      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          closed = true;
        }
      }, KEEPALIVE_INTERVAL_MS);

      while (!closed) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (closed) break;

        try {
          const newMessages = await prisma.message.findMany({
            where: {
              conversationId: id,
              OR: [
                { createdAt: { gt: lastDate } },
                { createdAt: lastDate, id: { gt: lastId ?? "" } },
              ],
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
          });

          if (newMessages.length > 0) {
            const unread = newMessages
              .filter((m) => m.senderId !== session.user.id && !m.readAt)
              .map((m) => m.id);

            if (unread.length > 0) {
              await prisma.message.updateMany({
                where: { id: { in: unread } },
                data: { readAt: new Date() },
              });
            }

            const serialized = newMessages.map((m) => ({
              id: m.id,
              content: m.content,
              imageUrl: m.imageUrl ?? null,
              createdAt: m.createdAt.toISOString(),
              readAt: m.readAt?.toISOString() ?? null,
              sender: m.sender,
            }));

            send(controller, "messages", serialized);
            const last = newMessages[newMessages.length - 1]!;
            lastDate = last.createdAt;
            lastId = last.id;
          }
        } catch (err) {
          console.error("[stream] poll error:", err);
        }
      }

      clearInterval(keepalive);
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
