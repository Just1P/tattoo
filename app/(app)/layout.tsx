import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ROLE_SELECTION_PATH = "/role-selection";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";

  if (pathname !== ROLE_SELECTION_PATH) {
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roleSelected: true },
      });

      if (user && !user.roleSelected) {
        redirect(ROLE_SELECTION_PATH);
      }
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
