import { getSession } from "@/lib/auth";
import { NotificationType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.discriminatedUnion("response", [
  z.object({ response: z.literal("accept") }),
  z.object({ response: z.literal("decline"), clientNote: z.string().trim().optional() }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { artist: { select: { id: true, artistName: true, userId: true } } },
  });

  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (booking.status !== "confirmed" || booking.clientConfirmedAt !== null) {
    return NextResponse.json(
      { error: "Cette réservation n'attend pas de réponse de votre part" },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const data = parsed.data;

  if (data.response === "accept") {
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: { clientConfirmedAt: new Date() },
      });
      await tx.notification.create({
        data: {
          userId: booking.artist.userId,
          type: NotificationType.booking_client_confirmed,
          payload: {
            bookingId: id,
            clientName: session.user.name ?? "Le client",
          },
        },
      });
      return updated;
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: {
        status: "pending",
        startAt: null,
        endAt: null,
        clientConfirmedAt: null,
        artistNote: null,
        clientNote: data.clientNote ?? null,
      },
    });
    await tx.notification.create({
      data: {
        userId: booking.artist.userId,
        type: NotificationType.booking_client_declined,
        payload: {
          bookingId: id,
          clientName: session.user.name ?? "Le client",
          clientNote: data.clientNote ?? null,
        },
      },
    });
    return updated;
  });

  return NextResponse.json(updated);
}
