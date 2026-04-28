"use client";

import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  artistId: string;
  initialIsFollowed: boolean;
};

export function FollowButton({ artistId, initialIsFollowed }: Props) {
  const { data: session, isPending } = useSession();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleToggle() {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    setIsFollowed((prev) => !prev);
    setLoading(true);

    try {
      const res = await fetch(`/api/artists/${artistId}/follow`, {
        method: isFollowed ? "DELETE" : "POST",
      });

      if (!res.ok) {
        setIsFollowed((prev) => !prev);
        toast.error("Une erreur est survenue");
        return;
      }

      toast.success(isFollowed ? "Artiste retiré des favoris" : "Artiste suivi !");
    } catch {
      setIsFollowed((prev) => !prev);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant={isFollowed ? "default" : "outline"}
        onClick={handleToggle}
        disabled={isPending || loading}
      >
        {isFollowed ? "Suivi ✓" : "Suivre"}
      </Button>

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason="pour suivre cet artiste"
      />
    </>
  );
}
