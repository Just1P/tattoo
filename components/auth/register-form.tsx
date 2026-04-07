"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().email("Adresse email invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string(),
    role: z.enum(["client", "artist"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "artist">("client");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "client",
    },
  });

  function toggleRole(value: "client" | "artist") {
    setRole(value);
    setValue("role", value);
  }

  async function onSubmit(values: RegisterValues) {
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    });

    if (error) {
      toast.error(getAuthErrorMessage(error.code ?? ""));
      return;
    }

    toast.success("Compte créé avec succès !");
    router.push(values.role === "artist" ? "/onboarding" : "/");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <Typography tag="h3">Créer un compte</Typography>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-1 rounded-lg">
            <Button
              type="button"
              variant={role === "client" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => toggleRole("client")}
            >
              Client
            </Button>
            <Button
              type="button"
              variant={role === "artist" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => toggleRole("artist")}
            >
              Tatoueur
            </Button>
          </div>

          <div className="space-y-1">
            <label htmlFor="name">
              <Typography tag="p" weight="medium">
                Nom
              </Typography>
            </label>
            <Input
              id="name"
              placeholder="Jean Dupont"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <Typography tag="p" color="destructive">
                {errors.name.message}
              </Typography>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="email">
              <Typography tag="p" weight="medium">
                Email
              </Typography>
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
              <Typography tag="p" weight="medium">
                Mot de passe
              </Typography>
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
          <div className="space-y-1">
            <label htmlFor="confirmPassword">
              <Typography tag="p" weight="medium">
                Confirmer le mot de passe
              </Typography>
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <Typography tag="p" color="destructive">
                {errors.confirmPassword.message}
              </Typography>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Typography tag="span" color="muted">
          Déjà un compte ?&nbsp;
        </Typography>
        <Link href="/login">
          <Typography tag="span" color="primary" underline>
            Se connecter
          </Typography>
        </Link>
      </CardFooter>
    </Card>
  );
}
