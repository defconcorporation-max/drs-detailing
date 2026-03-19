import { Resend } from "resend"

export type ReminderJobPayload = {
    id: string
    scheduledDate: Date
    client: {
        accessKey: string | null
        user: { email: string | null; name: string | null }
    }
}

export type SendReminderResult =
    | { ok: true; simulated?: boolean }
    | { ok: false; error: string }

/**
 * Envoie un email de rappel (Resend) si RESEND_API_KEY + RESEND_FROM_EMAIL sont définis.
 * Sinon : log console (simulation) et retour ok + simulated.
 */
export async function sendClientReminderEmail(
    job: ReminderJobPayload,
    type: "J1" | "H2"
): Promise<SendReminderResult> {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")

    const to = job.client.user.email?.trim()
    if (!to) {
        return { ok: false, error: "Client sans adresse email" }
    }

    const portalPath = job.client.accessKey ? `/client/${job.client.accessKey}` : null
    const portalUrl = portalPath ? `${baseUrl}${portalPath}` : baseUrl

    const dateStr = new Date(job.scheduledDate).toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    const subject =
        type === "J1"
            ? "Rappel : votre rendez-vous DRS demain"
            : "Rappel : votre rendez-vous DRS dans environ 2 heures"

    const intro =
        type === "J1"
            ? "Votre rendez-vous est prévu <strong>demain</strong>."
            : "Votre rendez-vous est prévu dans environ <strong>2 heures</strong>."

    const name = job.client.user.name?.trim() || "Bonjour"

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>${name},</p>
  <p>${intro}</p>
  <p><strong>Date :</strong> ${dateStr}</p>
  ${
      portalPath
          ? `<p><a href="${portalUrl}" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Mon espace client</a></p>
             <p style="font-size:14px;color:#666;">Confirmer, replanifier ou annuler depuis ce lien.</p>`
          : `<p style="font-size:14px;color:#666;">Pour toute modification, contactez-nous.</p>`
  }
  <p>À bientôt,<br/>L'équipe DRS Detailing</p>
</body>
</html>`.trim()

    if (!apiKey || !from) {
        console.log(
            `[Reminder:${type}] Simulation email → ${to} | sujet: ${subject} | lien: ${portalUrl} | définir RESEND_API_KEY + RESEND_FROM_EMAIL pour l’envoi réel`
        )
        return { ok: true, simulated: true }
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
    })

    if (error) {
        return { ok: false, error: error.message }
    }

    return { ok: true }
}
