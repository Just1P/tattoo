"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
};

type Props = {
  unreadCount: number;
  onRead: () => void;
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function notificationLabel(n: Notification): string {
  const p = n.payload;
  switch (n.type) {
    case "booking_request":
      return `Nouvelle demande de ${str(p.clientName, "un client")} — ${str(p.bodyPart, "")}`;
    case "booking_confirmed":
      return `Réservation confirmée par ${str(p.artistName, "l'artiste")}`;
    case "booking_cancelled":
      return `Réservation annulée par ${str(p.artistName, "l'artiste")}`;
    case "new_follower":
      return `${str(p.followerName, "Quelqu'un")} vous suit maintenant`;
    default:
      return "Nouvelle notification";
  }
}

function notificationHref(n: Notification): string {
  switch (n.type) {
    case "booking_request":
      return "/dashboard/bookings";
    case "booking_confirmed":
    case "booking_cancelled":
      return "/bookings";
    case "new_follower":
      return "/dashboard";
    default:
      return "/";
  }
}

export function NotificationDropdown({ unreadCount, onRead }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    }
  }

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      onRead();
    }
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      setNotifications([]);
      onRead();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Notifications">
          <div className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Aucune notification
          </p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
              onClick={async () => {
                await markRead(n.id);
                setOpen(false);
                router.push(notificationHref(n));
              }}
            >
              <span className="text-sm">{notificationLabel(n)}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
