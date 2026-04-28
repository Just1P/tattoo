import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleSelected: true },
    });

    if (user && !user.roleSelected) {
      redirect("/role-selection");
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <main className="flex-1 px-8 pt-16 pb-16">{children}</main>
      </div>
    </SidebarProvider>
  );
}
