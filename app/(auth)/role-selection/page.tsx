"use client";

import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RoleSelectionPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function selectRole(role: "client" | "artist") {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/me/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du rôle");
      }

      toast.success("Compte configuré avec succès !");
      window.location.href = role === "artist" ? "/onboarding" : "/";
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <Typography tag="h3" align="center">
              Bienvenue, {session.user.name} !
            </Typography>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Typography tag="p" color="muted" align="center">
            Comment souhaitez-vous utiliser Tattoo Pro ?
          </Typography>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-2 py-6"
              disabled={isSubmitting}
              onClick={() => selectRole("client")}
            >
              <span className="text-2xl">🔍</span>
              <Typography tag="span" weight="medium">
                Client
              </Typography>
              <Typography tag="span" color="muted" size="sm" align="center">
                Je cherche un tatoueur
              </Typography>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col gap-2 py-6"
              disabled={isSubmitting}
              onClick={() => selectRole("artist")}
            >
              <span className="text-2xl">🎨</span>
              <Typography tag="span" weight="medium">
                Tatoueur
              </Typography>
              <Typography tag="span" color="muted" size="sm" align="center">
                Je propose mes services
              </Typography>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
