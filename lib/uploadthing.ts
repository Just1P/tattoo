import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  messageImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      acl: "public-read",
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session) throw new Error("Non authentifié");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  tattooImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      acl: "public-read",
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session) throw new Error("Non authentifié");
      if ((session.user as { role?: string }).role !== "artist")
        throw new Error("Accès interdit");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
