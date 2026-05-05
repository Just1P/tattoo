import { ArtistVerificationTable } from "@/components/admin/artist-verification-table";
import Typography from "@/components/custom/Typography";
import { prisma } from "@/lib/prisma";

const onboardingComplete = { artistName: { not: null }, siret: { not: null } };

async function getArtistsByStatus(status: "pending" | "approved" | "rejected") {
  return prisma.tattooArtist.findMany({
    where: { verified: status, ...onboardingComplete },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "pending" } = await searchParams;
  const activeTab = ["pending", "approved", "rejected"].includes(tab)
    ? (tab as "pending" | "approved" | "rejected")
    : "pending";

  const [pending, approved, rejected] = await Promise.all([
    prisma.tattooArtist.count({ where: { verified: "pending", ...onboardingComplete } }),
    prisma.tattooArtist.count({ where: { verified: "approved", ...onboardingComplete } }),
    prisma.tattooArtist.count({ where: { verified: "rejected", ...onboardingComplete } }),
  ]);

  const artists = await getArtistsByStatus(activeTab);

  const tabs: { key: "pending" | "approved" | "rejected"; label: string; count: number }[] = [
    { key: "pending", label: "En attente", count: pending },
    { key: "approved", label: "Approuvés", count: approved },
    { key: "rejected", label: "Refusés", count: rejected },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <Typography tag="h1">Vérification des artistes</Typography>
        <Typography tag="p" color="muted">
          Gérez les demandes d&apos;inscription des tatoueurs.
        </Typography>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(({ key, label, count }) => (
          <a
            key={key}
            href={`?tab=${key}`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {count}
            </span>
          </a>
        ))}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ArtistVerificationTable artists={artists as any} />
    </main>
  );
}
