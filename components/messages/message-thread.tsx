"use client";

import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Send } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

type Sender = {
  id: string;
  name: string | null;
  image: string | null;
};

type Message = {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  readAt: string | null;
  sender: Sender;
  uploading?: boolean;
  localPreview?: string;
};

const OPTIMISTIC_ID = "__optimistic__";

function formatMessageDate(iso: string) {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `Hier ${format(date, "HH:mm")}`;
  return format(date, "d MMM HH:mm", { locale: fr });
}

type Props = {
  conversationId: string;
  initialMessages: Message[];
  initialHasMore: boolean;
  currentUserId: string;
  otherUser: { name: string | null; image: string | null } | null;
};

export function MessageThread({
  conversationId,
  initialMessages,
  initialHasMore,
  currentUserId,
  otherUser,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const localPreviewUrlRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser: Sender = { id: currentUserId, name: null, image: null };

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
        localPreviewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loadingMore) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loadingMore]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const oldestReal = messages.find((m) => m.id !== OPTIMISTIC_ID);
    if (!oldestReal) return;

    setLoadingMore(true);

    const container = scrollContainerRef.current;
    const scrollHeightBefore = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?cursor=${oldestReal.id}`,
      );
      if (!res.ok) return;

      const { messages: older, hasMore: moreAvailable } =
        (await res.json()) as {
          messages: Message[];
          hasMore: boolean;
        };

      setHasMore(moreAvailable);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = older.filter((m: Message) => !existingIds.has(m.id));
        return [...fresh, ...prev];
      });

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - scrollHeightBefore;
        }
      });
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore, messages]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const lastId = messages.filter((m) => m.id !== OPTIMISTIC_ID).at(-1)?.id;
    const url = `/api/conversations/${conversationId}/stream${lastId ? `?afterId=${lastId}` : ""}`;

    const es = new EventSource(url);

    es.addEventListener("messages", (e) => {
      const incoming: Message[] = JSON.parse(e.data);
      if (incoming.length === 0) return;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = incoming.filter((m) => !existingIds.has(m.id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh];
      });
    });

    es.onerror = () => {};

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const { startUpload, isUploading } = useUploadThing("messageImage", {
    onClientUploadComplete: async (files) => {
      const url = files[0]?.ufsUrl;
      if (!url) return;

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: url }),
          },
        );

        if (!res.ok) throw new Error();

        const message: Message = await res.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === OPTIMISTIC_ID
              ? { ...message, localPreview: m.localPreview }
              : m,
          ),
        );
      } catch {
        toast.error("Erreur lors de l'envoi de l'image");
        setMessages((prev) => prev.filter((m) => m.id !== OPTIMISTIC_ID));
      } finally {
      }
    },
    onUploadError: () => {
      toast.error("Erreur lors de l'upload de l'image");
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
        localPreviewUrlRef.current = null;
      }
      setMessages((prev) => prev.filter((m) => m.id !== OPTIMISTIC_ID));
    },
  });

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setContent("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'envoi");
        return;
      }
      const message: Message = await res.json();
      setMessages((prev) => [...prev, message]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    localPreviewUrlRef.current = localPreview;

    const optimistic: Message = {
      id: OPTIMISTIC_ID,
      content: null,
      imageUrl: null,
      localPreview,
      uploading: true,
      createdAt: new Date().toISOString(),
      readAt: null,
      sender: currentUser,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    inputRef.current?.focus();

    startUpload([file]);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0">
        <div className="size-10 rounded-full overflow-hidden bg-muted shrink-0">
          {otherUser?.image ? (
            <Image
              src={otherUser.image}
              alt={otherUser.name ?? ""}
              width={40}
              height={40}
              className="object-cover size-full"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-medium text-muted-foreground">
              {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {otherUser?.name ?? "Conversation"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
      >
        {/* Sentinel en haut + indicateur de chargement */}
        <div ref={topSentinelRef} className="h-1" />
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 && !loadingMore && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Démarrez la conversation
          </p>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender.id === currentUserId;
          const prev = messages[i - 1];
          const isFirstInGroup = !prev || prev.sender.id !== msg.sender.id;
          const next = messages[i + 1];
          const isLastInGroup = !next || next.sender.id !== msg.sender.id;
          const displayImage = msg.localPreview ?? msg.imageUrl;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                isMine ? "flex-row-reverse" : "flex-row",
                !isLastInGroup && "mb-0.5",
              )}
            >
              {/* Avatar */}
              <div className="size-8 shrink-0">
                {!isMine && isLastInGroup ? (
                  <div className="size-8 rounded-full overflow-hidden bg-muted">
                    {msg.sender.image ? (
                      <Image
                        src={msg.sender.image}
                        alt={msg.sender.name ?? ""}
                        width={32}
                        height={32}
                        className="object-cover size-full"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                        {msg.sender.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col max-w-[65%]">
                {!isMine && isFirstInGroup && (
                  <p className="text-[11px] text-muted-foreground mb-1 ml-1">
                    {msg.sender.name ?? "Utilisateur"},{" "}
                    {formatMessageDate(msg.createdAt)}
                  </p>
                )}
                {isMine && isFirstInGroup && (
                  <p className="text-[11px] text-muted-foreground mb-1 text-right mr-1">
                    {formatMessageDate(msg.createdAt)}
                  </p>
                )}

                {displayImage ? (
                  <div className="relative overflow-hidden rounded-2xl max-w-[260px]">
                    {/*
                      Si le message a encore un localPreview (blob) ET une imageUrl distante,
                      on affiche les deux en superposition : le blob reste visible jusqu'à ce
                      que l'image distante soit entièrement chargée (onLoad), puis on retire
                      le localPreview — aucun blink.
                      Next/Image peut optimiser l'URL distante mais pas un blob, donc :
                      - image de préchargement invisible → Next/Image (URL distante)
                      - image visible blob → <img> native (blob URL)
                      - image visible finale → Next/Image (URL distante)
                    */}
                    {msg.localPreview && msg.imageUrl && (
                      <Image
                        src={msg.imageUrl}
                        alt=""
                        aria-hidden
                        fill
                        className="object-cover opacity-0 pointer-events-none"
                        onLoad={() => {
                          if (localPreviewUrlRef.current === msg.localPreview) {
                            URL.revokeObjectURL(localPreviewUrlRef.current);
                            localPreviewUrlRef.current = null;
                          } else if (msg.localPreview) {
                            URL.revokeObjectURL(msg.localPreview);
                          }
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === msg.id
                                ? { ...m, localPreview: undefined }
                                : m,
                            ),
                          );
                        }}
                      />
                    )}
                    {msg.localPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.localPreview}
                        alt="Image"
                        width={260}
                        height={200}
                        className="object-cover w-full"
                      />
                    ) : msg.imageUrl ? (
                      <Image
                        src={msg.imageUrl}
                        alt="Image"
                        width={260}
                        height={200}
                        className="object-cover w-full"
                      />
                    ) : null}
                    {msg.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg
                          className="size-6 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm leading-relaxed",
                      isMine
                        ? cn(
                            "bg-primary text-primary-foreground",
                            "rounded-[20px]",
                            !isLastInGroup && "rounded-br-md",
                            !isFirstInGroup && "rounded-tr-md",
                          )
                        : cn(
                            "bg-muted text-foreground",
                            "rounded-[20px]",
                            !isLastInGroup && "rounded-bl-md",
                            !isFirstInGroup && "rounded-tl-md",
                          ),
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="px-4 py-3 border-t shrink-0">
        <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            onMouseDown={(e) => e.preventDefault()}
            disabled={sending || isUploading}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
            aria-label="Envoyer une image"
          >
            <ImageIcon className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isUploading ? "Envoi de l'image…" : "Écrire un message…"
            }
            disabled={isUploading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            onMouseDown={(e) => e.preventDefault()}
            disabled={sending || isUploading || !content.trim()}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
