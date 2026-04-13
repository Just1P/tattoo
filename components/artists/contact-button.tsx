"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ContactButton({ artistId }: { artistId: string }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  function handleContact() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    router.push(`/dashboard/messages?artistId=${encodeURIComponent(artistId)}`);
  }

  return (
    <Button onClick={handleContact} disabled={isPending}>
      Contacter
    </Button>
  );
}
