"use client";

import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
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
import { BookOpen, CalendarDays, Images, LayoutDashboard, LogIn, LogOut, Rss, Search, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    async function fetchCounts() {
      const res = await fetch("/api/me/counts");
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.unreadNotifications);
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
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
        ]
      : []),
    ...(role === "client"
      ? [
          { label: "Mon profil", href: "/profile", icon: User },
          { label: "Mes rendez-vous", href: "/bookings", icon: BookOpen },
        ]
      : []),
    ...(role === "admin"
      ? [
          { label: "Vérification artistes", href: "/admin/verification", icon: ShieldCheck },
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
                    <Icon />
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
          {session?.user && (
            <SidebarMenuItem>
              <NotificationDropdown unreadCount={unreadNotifications} onRead={(delta) => setUnreadNotifications((prev) => Math.max(0, prev - delta))} />
            </SidebarMenuItem>
          )}
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
