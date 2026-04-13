"use client";

import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <Typography tag="h2">Mon compte</Typography>
          </CardTitle>
          <CardDescription>
            <Typography tag="p" color="muted">
              Informations de la session active
            </Typography>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {session?.user ? (
            <>
              <div className="flex justify-between">
                <Typography tag="p" color="muted">
                  Nom
                </Typography>
                <Typography tag="p" weight="medium">
                  {session.user.name}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography tag="p" color="muted">
                  Email
                </Typography>
                <Typography tag="p" weight="medium">
                  {session.user.email}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography tag="p" color="muted">
                  Rôle
                </Typography>
                <Typography tag="p" weight="medium">
                  {session.user.role === "artist" ? "Tatoueur" : "Client"}
                </Typography>
              </div>
            </>
          ) : (
            <Typography tag="p" color="muted">
              Aucune session active.
            </Typography>
          )}
        </CardContent>
        <CardFooter>
          {session?.user ? (
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          ) : (
            <Button className="w-full" onClick={() => router.push("/login")}>
              Se connecter
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
