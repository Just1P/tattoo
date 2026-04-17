"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Message contextuel affiché sous le titre, ex: "pour contacter cet artiste" */
  reason?: string;
};

export function AuthRequiredModal({ open, onClose, reason }: Props) {
  const router = useRouter();

  function handleLogin() {
    onClose();
    router.push("/login");
  }

  function handleRegister() {
    onClose();
    router.push("/register");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connexion requise</DialogTitle>
          <DialogDescription>
            Vous devez être connecté{reason ? ` ${reason}` : " pour accéder à cette fonctionnalité"}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleLogin} className="w-full gap-2">
            <LogIn className="size-4" />
            Se connecter
          </Button>
          <Button onClick={handleRegister} variant="outline" className="w-full gap-2">
            <UserPlus className="size-4" />
            Créer un compte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
