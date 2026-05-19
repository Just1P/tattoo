import { getSession } from "@/lib/auth";
import { sendBookingCancelledEmail, sendBookingConfirmedEmail } from "@/lib/email";
import { NotificationType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("confirmed"),
    startAt: z.string().datetime({ message: "Date de début invalide" }),
    endAt: z.string().datetime({ message: "Date de fin invalide" }),
    artistNote: z.string().trim().optional(),
  }),
  z.object({
    status: z.literal("cancelled"),
    artistNote: z.string().trim().optional(),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.user.role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const { id } = await params;

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json(
      { error: "Profil artiste introuvable" },
      { status: 404 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking || booking.artistId !== artist.id) {
    return NextResponse.json(
      { error: "Réservation introuvable" },
      { status: 404 },
    );
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "Seules les demandes en attente peuvent être modifiées" },
      { status: 409 },
    );
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

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const data = parsed.data;

  if (data.status === "confirmed") {
    if (new Date(data.startAt) >= new Date(data.endAt)) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 422 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: "confirmed",
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),
          artistNote: data.artistNote ?? null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
      await tx.notification.create({
        data: {
          userId: updated.user.id,
          type: NotificationType.booking_confirmed,
          payload: {
            bookingId: id,
            artistName: artist.artistName ?? "L'artiste",
            startAt: data.startAt,
          },
        },
      });
      return updated;
    });

    void sendBookingConfirmedEmail({
      to: updated.user.email,
      clientName: updated.user.name ?? "Client",
      artistName: artist.artistName ?? "L'artiste",
      startAt: new Date(data.startAt),
      artistNote: data.artistNote,
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        artistNote: data.artistNote ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    await tx.notification.create({
      data: {
        userId: updated.user.id,
        type: NotificationType.booking_cancelled,
        payload: {
          bookingId: id,
          artistName: artist.artistName ?? "L'artiste",
          artistNote: data.artistNote ?? null,
        },
      },
    });
    return updated;
  });

  void sendBookingCancelledEmail({
    to: updated.user.email,
    clientName: updated.user.name ?? "Client",
    artistName: artist.artistName ?? "L'artiste",
    artistNote: data.artistNote,
  });

  return NextResponse.json(updated);
}
