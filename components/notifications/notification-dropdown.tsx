"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  payload: Record<string, string>;
  createdAt: string;
};

function notificationLabel(n: Notification): string {
  const p = n.payload;
  switch (n.type) {
    case "booking_request":
      return `Nouvelle demande de ${p.clientName ?? "un client"} — ${p.bodyPart ?? ""}`;
    case "booking_confirmed":
      return `Réservation confirmée par ${p.artistName ?? "l'artiste"}`;
    case "booking_cancelled":
      return `Réservation annulée par ${p.artistName ?? "l'artiste"}`;
    case "new_follower":
      return `${p.followerName ?? "Quelqu'un"} vous suit maintenant`;
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

export function NotificationDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications([]);
  }

  const count = notifications.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Notifications">
          <div className="relative">
            <Bell />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </div>
          <span>Notifications</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {count > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {count === 0 ? (
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
                {new Date(n.createdAt).toLocaleDateString("fr-FR", {
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
