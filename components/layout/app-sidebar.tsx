"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { BookOpen, CalendarDays, Images, LayoutDashboard, LogIn, LogOut, MessageCircle, Rss, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    async function fetchUnread() {
      const res = await fetch("/api/me/unread-count");
      if (res.ok) {
        const { count } = await res.json();
        setUnreadCount(count);
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session?.user, pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const navLinks = [
    { label: "Feed", href: "/feed", icon: Rss },
    { label: "Trouver un artiste", href: "/artists", icon: Search },
    ...(role === "artist"
      ? [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Mon profil", href: "/profile", icon: User },
          { label: "Portfolio", href: "/dashboard/portfolio", icon: Images },
          { label: "Disponibilités", href: "/dashboard/availability", icon: CalendarDays },
          { label: "Réservations", href: "/dashboard/bookings", icon: BookOpen },
          { label: "Messages", href: "/messages", icon: MessageCircle },
        ]
      : []),
    ...(role === "client"
      ? [
          { label: "Mon profil", href: "/profile", icon: User },
          { label: "Mes rendez-vous", href: "/bookings", icon: BookOpen },
          { label: "Messages", href: "/messages", icon: MessageCircle },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/">
          <Image
            src="/logo/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="size-11"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navLinks.map(({ label, href, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href}
                  tooltip={label}
                >
                  <Link href={href}>
                    <div className="relative">
                      <Icon />
                      {href === "/messages" && unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {session?.user ? (
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip="Se déconnecter"
                className="cursor-pointer"
              >
                <LogOut />
                <span>Se déconnecter</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild tooltip="Se connecter">
                <Link href="/login">
                  <LogIn />
                  <span>Se connecter</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
