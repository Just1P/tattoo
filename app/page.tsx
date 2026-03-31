"use client";

import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
          <CardDescription>Informations de la session active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {session?.user ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{session.user.email}</span>
              </div>

            </>
          ) : (
            <p className="text-muted-foreground">Aucune session active.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
