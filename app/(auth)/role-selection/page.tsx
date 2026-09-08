import { RoleSelectionForm } from "@/components/onboarding/role-selection-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RoleSelectionPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleSelected: true },
  });
  if (user?.roleSelected) redirect("/");

  return <RoleSelectionForm userName={session.user.name} />;
}
