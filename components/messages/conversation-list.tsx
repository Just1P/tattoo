"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

type Participant = {
  id: string;
  name: string | null;
  image: string | null;
};

type LastMessage = {
  content: string | null;
  createdAt: string;
  senderId: string;
};

type Conversation = {
  id: string;
  updatedAt: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
  participants: Participant[];
};

type Props = {
  conversations: Conversation[];
  currentUserId: string;
};

export function ConversationList({ conversations, currentUserId }: Props) {
  const pathname = usePathname();
  const basePath = "/messages";
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((conv) => {
    const other = conv.participants.find((p) => p.id !== currentUserId);
    return other?.name?.toLowerCase().includes(search.toLowerCase()) ?? true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Barre de recherche */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune conversation
          </p>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants.find((p) => p.id !== currentUserId);
            const isActive = pathname === `${basePath}/${conv.id}`;

            return (
              <Link
                key={conv.id}
                href={`${basePath}/${conv.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                  isActive && "bg-muted"
                )}
              >
                {/* Avatar avec indicateur unread */}
                <div className="relative shrink-0">
                  <div className="size-11 rounded-full overflow-hidden bg-muted">
                    {other?.image ? (
                      <Image
                        src={other.image}
                        alt={other.name ?? ""}
                        width={44}
                        height={44}
                        className="object-cover size-full"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-sm font-medium text-muted-foreground">
                        {other?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {other?.name ?? "Utilisateur"}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.updatedAt), {
                        addSuffix: false,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className={cn("text-xs truncate mt-0.5", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {conv.lastMessage
                      ? conv.lastMessage.senderId === currentUserId
                        ? `Vous : ${conv.lastMessage.content ?? "📷 Image"}`
                        : (conv.lastMessage.content ?? "📷 Image")
                      : "Démarrer la conversation"}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
