"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  artistUserId: string;
};

export function ContactButton({ artistUserId }: Props) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleContact() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: artistUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de la création de la conversation");
        return;
      }

      const { id } = await res.json();
      router.push(`/messages/${id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleContact} disabled={isPending || loading}>
      Contacter
    </Button>
  );
}
