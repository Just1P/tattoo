import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <main className="flex-1 px-8 pt-16 pb-16">{children}</main>
      </div>
    </SidebarProvider>
  );
}
