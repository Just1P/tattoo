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
        input: true,
      },
    },
  },
  plugins: [lastLoginMethod()],
  databaseHooks: {
    user: {
      create: {
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
