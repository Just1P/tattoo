"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ContactButton({ artistId }: { artistId: string }) {
  const { data: session } = useSession();
  const router = useRouter();

  function handleContact() {
    if (!session) {
      router.push("/login");
      return;
    }
    // TODO TICKET-08 : créer/ouvrir la conversation avec cet artiste
    router.push(`/dashboard/messages?artistId=${artistId}`);
  }

  return (
    <Button onClick={handleContact}>
      Contacter
    </Button>
  );
}
