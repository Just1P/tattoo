import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM =
  process.env.EMAIL_FROM ?? "Tattoo Pro <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function wrap(body: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head><body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:24px">
${body}
<hr style="margin-top:40px;border:none;border-top:1px solid #eee"/>
<p style="color:#888;font-size:12px">Tattoo Pro — <a href="${BASE_URL}" style="color:#888">tattoo-pro.fr</a></p>
</body></html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${label}</a>`;
}

// ─── Nouveau message (client uniquement) ───────────────────────────────────

export async function sendNewMessageEmail({
  to,
  senderName,
  preview,
  conversationId,
}: {
  to: string;
  senderName: string;
  preview: string;
  conversationId: string;
}) {
  const link = `${BASE_URL}/dashboard/messages/${conversationId}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nouveau message de ${senderName}`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Nouveau message 💬</h2>
      <p><strong>${senderName}</strong> vous a envoyé un message :</p>
      <blockquote style="border-left:3px solid #ddd;margin:16px 0;padding:8px 16px;color:#444;font-style:italic">
        ${preview.slice(0, 200)}${preview.length > 200 ? "…" : ""}
      </blockquote>
      ${btn(link, "Voir la conversation")}
    `),
  });
}

// ─── Nouvelle demande de booking (artiste) ────────────────────────────────

export async function sendNewBookingEmail({
  to,
  clientName,
  description,
  bodyPart,
  size,
}: {
  to: string;
  clientName: string;
  bookingId: string;
  description: string;
  bodyPart: string;
  size: string;
}) {
  const link = `${BASE_URL}/dashboard/bookings`;
  const sizeLabel: Record<string, string> = {
    petit: "Petit",
    moyen: "Moyen",
    grand: "Grand",
    tres_grand: "Très grand",
  };
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nouvelle demande de ${clientName}`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Nouvelle demande de réservation 📩</h2>
      <p><strong>${clientName}</strong> souhaite prendre rendez-vous avec vous.</p>
      <table style="margin:16px 0;border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px 6px 0;color:#888;width:120px">Zone</td><td style="padding:6px 0"><strong>${bodyPart}</strong></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888">Taille</td><td style="padding:6px 0"><strong>${sizeLabel[size] ?? size}</strong></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;vertical-align:top">Description</td><td style="padding:6px 0">${description}</td></tr>
      </table>
      ${btn(link, "Voir la demande")}
    `),
  });
}

// ─── Booking confirmé (client) ────────────────────────────────────────────

export async function sendBookingConfirmedEmail({
  to,
  clientName,
  artistName,
  startAt,
  artistNote,
}: {
  to: string;
  clientName: string;
  artistName: string;
  startAt: Date;
  artistNote?: string | null;
}) {
  const link = `${BASE_URL}/dashboard/bookings`;
  const dateStr = startAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre réservation est confirmée 🎉`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Réservation confirmée ✅</h2>
      <p>Bonjour ${clientName},</p>
      <p><strong>${artistName}</strong> a accepté votre demande.</p>
      <p style="margin:16px 0;font-size:18px;font-weight:600">${dateStr}</p>
      ${artistNote ? `<p style="color:#444">Note de l'artiste : <em>${artistNote}</em></p>` : ""}
      ${btn(link, "Voir mes réservations")}
    `),
  });
}

// ─── Booking refusé (client) ──────────────────────────────────────────────

export async function sendBookingCancelledEmail({
  to,
  clientName,
  artistName,
  artistNote,
}: {
  to: string;
  clientName: string;
  artistName: string;
  artistNote?: string | null;
}) {
  const link = `${BASE_URL}/artists`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre demande n'a pas été retenue`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Demande non retenue</h2>
      <p>Bonjour ${clientName},</p>
      <p><strong>${artistName}</strong> n'est pas en mesure d'accepter votre demande pour le moment.</p>
      ${artistNote ? `<p style="color:#444">Motif : <em>${artistNote}</em></p>` : ""}
      <p>Vous pouvez explorer d'autres artistes sur la plateforme.</p>
      ${btn(link, "Trouver un artiste")}
    `),
  });
}

// ─── Profil approuvé (artiste) ────────────────────────────────────────────

export async function sendProfileApprovedEmail({
  to,
  artistName,
  artistId,
}: {
  to: string;
  artistName: string;
  artistId: string;
}) {
  const link = `${BASE_URL}/artists/${artistId}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre profil est approuvé 🎉`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Profil approuvé ✅</h2>
      <p>Félicitations <strong>${artistName}</strong> !</p>
      <p>Votre profil artiste a été vérifié et est désormais visible par tous les clients sur Tattoo Pro.</p>
      ${btn(link, "Voir mon profil public")}
    `),
  });
}

// ─── Profil rejeté (artiste) ──────────────────────────────────────────────

export async function sendProfileRejectedEmail({
  to,
  artistName,
  verificationNote,
}: {
  to: string;
  artistName: string;
  verificationNote?: string | null;
}) {
  const link = `${BASE_URL}/dashboard`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre profil nécessite des modifications`,
    html: wrap(`
      <h2 style="margin-bottom:8px">Profil non approuvé</h2>
      <p>Bonjour <strong>${artistName}</strong>,</p>
      <p>Votre profil artiste n'a pas pu être validé en l'état.</p>
      ${verificationNote ? `<p style="color:#444">Motif : <em>${verificationNote}</em></p>` : ""}
      <p>Mettez votre profil à jour et resoumettez-le pour vérification.</p>
      ${btn(link, "Modifier mon profil")}
    `),
  });
}
