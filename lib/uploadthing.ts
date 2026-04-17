import { getSession } from "@/lib/auth";
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
      const session = await getSession();
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
      const session = await getSession();

      if (!session) throw new Error("Non authentifié");
      if (session.user.role !== "artist")
        throw new Error("Accès interdit");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
