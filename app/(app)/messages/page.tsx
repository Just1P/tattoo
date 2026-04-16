import { ConversationList } from "@/components/messages/conversation-list";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { getConversationsForUser } from "@/lib/conversation-queries";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const conversations = await getConversationsForUser(session.user.id);

  return (
    <div className="space-y-4">
      <Typography tag="h1">Messages</Typography>
      <div className="rounded-lg border overflow-hidden">
        <ConversationList
          conversations={conversations}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
