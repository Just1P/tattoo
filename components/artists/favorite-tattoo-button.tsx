"use client";

import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
import { useSession } from "@/lib/auth-client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  tattooId: string;
  initialIsFavorited: boolean;
};

export function FavoriteTattooButton({ tattooId, initialIsFavorited }: Props) {
  const { data: session, isPending } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();

    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    setIsFavorited((prev) => !prev);
    setLoading(true);

    try {
      const res = await fetch(`/api/tattoos/${tattooId}/favorite`, {
        method: isFavorited ? "DELETE" : "POST",
      });

      if (!res.ok) {
        setIsFavorited((prev) => !prev);
        toast.error("Une erreur est survenue");
        return;
      }

      toast.success(isFavorited ? "Retiré des favoris" : "Ajouté aux favoris !");
    } catch {
      setIsFavorited((prev) => !prev);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isPending || loading}
        className="rounded-full bg-black/50 p-1.5 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50"
        aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className="size-4"
          fill={isFavorited ? "white" : "none"}
          stroke="white"
        />
      </button>

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason="pour sauvegarder ce tatouage"
      />
    </>
  );
}
