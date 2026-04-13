import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if ((session.user as { role?: string }).role !== "artist") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card px-4 py-6">
        <nav className="flex flex-col gap-1">
          <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Dashboard
          </p>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Accueil
          </Link>
          <Link
            href="/dashboard/profile"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Mon profil
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
