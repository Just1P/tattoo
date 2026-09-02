import { auth } from "@/lib/auth";
import { sendNewBookingEmail } from "@/lib/email";
import { NotificationType, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { bookingRequestSchema } from "@/lib/validation/booking-schema";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { id: "bookings", limit: 5, windowSec: 60 });
  if (limited) return limited;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const artist = await prisma.tattooArtist.findUnique({
    where: { id: parsed.data.artistId },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  if (artist.userId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas faire une demande à vous-même" },
      { status: 403 },
    );
  }

  const existing = await prisma.booking.findFirst({
    where: {
      artistId: artist.id,
      userId: session.user.id,
      status: "pending",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà une demande en attente auprès de cet artiste" },
      { status: 409 },
    );
  }

  let booking, artistUser;
  try {
    [booking, artistUser] = await Promise.all([
      prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            artistId: artist.id,
            userId: session.user.id,
            tattooType: parsed.data.tattooType,
            bodyPart: parsed.data.bodyPart,
            size: parsed.data.size,
            description: parsed.data.description,
            referenceUrls: parsed.data.referenceUrls,
            status: "pending",
          },
        });
        await tx.notification.create({
          data: {
            userId: artist.userId,
            type: NotificationType.booking_request,
            payload: {
              bookingId: booking.id,
              clientName: session.user.name ?? "Un client",
              bodyPart: parsed.data.bodyPart,
            },
          },
        });
        return booking;
      }),
      prisma.user.findUnique({
        where: { id: artist.userId },
        select: { email: true },
      }),
    ]);
  } catch (error) {
    // Filet de sécurité contre la race condition du contrôle "existing"
    // ci-dessus (TOCTOU) : deux requêtes strictement simultanées peuvent
    // toutes deux le passer avant qu'aucune n'ait committé. L'index unique
    // partiel en base (migration 20260902084328) rejette la seconde
    // écriture avec une violation de contrainte.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande en attente auprès de cet artiste" },
        { status: 409 },
      );
    }
    throw error;
  }

  if (artistUser) {
    void sendNewBookingEmail({
      to: artistUser.email,
      clientName: session.user.name ?? "Un client",
      description: parsed.data.description,
      bodyPart: parsed.data.bodyPart,
      size: parsed.data.size,
    });
  }

  return NextResponse.json(booking, { status: 201 });
}
