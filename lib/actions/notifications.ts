"use server"

import prisma from "@/lib/db"

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

export async function sendSmsReminder(jobId: string, type: ReminderType) {
    // Placeholder dispatcher (Twilio/WhatsApp later).
    console.log(`[Reminder:${type}] Sending reminder for Job ${jobId}...`)
    await new Promise((resolve) => setTimeout(resolve, 200))
    return { success: true, message: `Rappel ${type} envoyé (simulation)` }
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
                await sendSmsReminder(job.id, "J1")
                sentJ1 += 1
            }
            if (shouldSendH2) {
                await sendSmsReminder(job.id, "H2")
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
