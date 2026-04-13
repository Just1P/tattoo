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
import { LayoutDashboard, LogIn, LogOut, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const navLinks = [
    { label: "Trouver un artiste", href: "/artists", icon: Search },
    ...(role === "artist"
      ? [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Mon profil", href: "/dashboard/profile", icon: User },
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
            width={400}
            height={400}
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
