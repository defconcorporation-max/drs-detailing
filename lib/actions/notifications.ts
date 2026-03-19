"use server"

import prisma from "@/lib/db"
import { sendClientReminderEmail } from "@/lib/email/send-client-reminder"

const TAG_J1 = "[REMINDER_J1_SENT]"
const TAG_H2 = "[REMINDER_H2_SENT]"

type ReminderType = "J1" | "H2"

function hasReminderTag(notes: string | null | undefined, tag: string) {
    return Boolean(notes?.includes(tag))
}

function appendReminderTag(notes: string | null | undefined, tag: string) {
    const current = notes?.trim() || ""
    if (!current) return tag
    if (current.includes(tag)) return current
    return `${current}\n${tag}`
}

/** Rappel client : email via Resend si configuré, sinon simulation (console). */
export async function sendReminderNotification(
    job: {
        id: string
        scheduledDate: Date
        client: {
            accessKey: string | null
            user: { email: string | null; name: string | null }
        }
    },
    type: ReminderType
) {
    const result = await sendClientReminderEmail(job, type)
    if (!result.ok) {
        throw new Error(result.error)
    }
    return {
        success: true,
        message: result.simulated ? `Rappel ${type} (simulation — pas de Resend)` : `Rappel ${type} envoyé par email`,
    }
}

export async function runReminderDispatch() {
    const now = new Date()
    const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    // Jobs that can still be reminded.
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: { gte: now, lte: horizon },
            status: { in: ["CONFIRMED", "SCHEDULED"] },
        },
        include: {
            client: { include: { user: true } },
        },
    })

    let sentJ1 = 0
    let sentH2 = 0
    const failures: string[] = []

    for (const job of jobs) {
        const deltaMin = Math.floor((new Date(job.scheduledDate).getTime() - now.getTime()) / 60000)

        // J-1 window: 23h to 25h
        const shouldSendJ1 = deltaMin >= 1380 && deltaMin <= 1500 && !hasReminderTag(job.notes, TAG_J1)
        // H-2 window: 1h50 to 2h10
        const shouldSendH2 = deltaMin >= 110 && deltaMin <= 130 && !hasReminderTag(job.notes, TAG_H2)

        if (!shouldSendJ1 && !shouldSendH2) continue

        try {
            if (shouldSendJ1) {
                await sendReminderNotification(job, "J1")
                sentJ1 += 1
            }
            if (shouldSendH2) {
                await sendReminderNotification(job, "H2")
                sentH2 += 1
            }

            let newNotes = job.notes || ""
            if (shouldSendJ1) newNotes = appendReminderTag(newNotes, TAG_J1)
            if (shouldSendH2) newNotes = appendReminderTag(newNotes, TAG_H2)
            newNotes = newNotes.replace(/\n{2,}/g, "\n").trim()

            await prisma.job.update({
                where: { id: job.id },
                data: { notes: newNotes || job.notes || null },
            })
        } catch (err) {
            failures.push(`${job.id}:${String(err)}`)
        }
    }

    return {
        success: failures.length === 0,
        scanned: jobs.length,
        sentJ1,
        sentH2,
        failures,
    }
}
