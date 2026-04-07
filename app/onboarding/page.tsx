import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "artist") redirect("/");

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
    include: { artistStyles: true },
  });

  if (artist?.artistName && artist?.siret) redirect("/dashboard");

  const styles = await prisma.style.findMany({
    orderBy: { name: "asc" },
  });

  return <OnboardingForm styles={styles} />;
}
