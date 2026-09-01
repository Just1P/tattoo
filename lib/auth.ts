import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { lastLoginMethod } from "better-auth/plugins";
import { headers } from "next/headers";
import { prisma } from "./prisma";

export type UserRole = "client" | "artist" | "admin";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "client",
        // Jamais accepté tel quel depuis la requête client : voir
        // databaseHooks.user.create.before, qui revalide et filtre la
        // valeur contre une liste blanche avant création. Sans ce
        // "input: false", un appel direct à l'API d'inscription avec
        // { role: "admin" } créait un compte administrateur (corrigé le
        // 2026-09-01, voir docs/securite/test-securite.md).
        input: false,
      },
    },
  },
  plugins: [lastLoginMethod()],
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const requestedRole = (context?.body as { role?: unknown } | undefined)
            ?.role;
          const ALLOWED_SIGNUP_ROLES = ["client", "artist"] as const;
          const role = ALLOWED_SIGNUP_ROLES.includes(
            requestedRole as (typeof ALLOWED_SIGNUP_ROLES)[number],
          )
            ? (requestedRole as "client" | "artist")
            : "client";

          return { data: { ...user, role } };
        },
        after: async (user) => {
          const typedUser = user as { role?: UserRole; passwordHash?: string | null };

          // Les comptes créés via email ont un passwordHash : le rôle a été choisi explicitement
          if (typedUser.passwordHash) {
            await prisma.user.update({
              where: { id: user.id },
              data: { roleSelected: true },
            });
          }

          if (typedUser.role !== "artist") return;
          await prisma.tattooArtist.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          });
        },
      },
    },
  },
});

type SessionWithRole = Awaited<ReturnType<typeof auth.api.getSession>> & {
  user: { role: UserRole };
} | null;

export async function getSession(): Promise<SessionWithRole> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session as SessionWithRole;
}
