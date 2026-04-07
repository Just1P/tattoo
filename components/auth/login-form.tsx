"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Typography from "@/components/custom/Typography";
import { signIn } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(getAuthErrorMessage(error.code ?? ""));
      return;
    }

    toast.success("Connexion réussie !");
    router.push("/");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <Typography tag="h3">Connexion</Typography>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email">
              <Typography tag="p" weight="medium">Email</Typography>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <Typography tag="p" color="destructive">
                {errors.email.message}
              </Typography>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="password">
              <Typography tag="p" weight="medium">Mot de passe</Typography>
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <Typography tag="p" color="destructive">
                {errors.password.message}
              </Typography>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Typography tag="span" color="muted">Pas encore de compte ?&nbsp;</Typography>
        <Link href="/register">
          <Typography tag="span" color="primary" underline>S&apos;inscrire</Typography>
        </Link>
      </CardFooter>
    </Card>
  );
}
