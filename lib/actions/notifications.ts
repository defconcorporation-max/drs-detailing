"use server"

import prisma from "@/lib/db"
import { sendClientReminderEmail } from "@/lib/email/send-client-reminder"
import { sendSMS } from "@/lib/actions/sms"
import { getLocalDateAndHourInTZ } from "@/lib/date-local"
import { differenceInDays } from "date-fns"

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
    const montrealNow = getLocalDateAndHourInTZ(now, "America/Montreal")
    const failures: string[] = []

    const settings = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })

    // 1. Same-Day at 7 AM SMS automation
    const is7AM = montrealNow.hour === 7
    let sentSameDay = 0
    if (is7AM && settings?.smsM7Enabled) {
        // Query jobs for today
        const startOfTodayUtc = new Date(now)
        startOfTodayUtc.setHours(0, 0, 0, 0)
        const endOfTodayUtc = new Date(now)
        endOfTodayUtc.setHours(23, 59, 59, 999)

        const todayJobs = await prisma.job.findMany({
            where: {
                scheduledDate: { gte: startOfTodayUtc, lte: endOfTodayUtc },
                status: { in: ["CONFIRMED", "SCHEDULED"] }
            },
            include: {
                client: { include: { user: true } }
            }
        })

        for (const job of todayJobs) {
            const jDate = new Date(job.scheduledDate)
            const tzInfo = getLocalDateAndHourInTZ(jDate, "America/Montreal")
            
            if (tzInfo.dateStr === montrealNow.dateStr && !hasReminderTag(job.notes, "[REMINDER_M7_SENT]")) {
                try {
                    if (job.client?.user?.phone) {
                        const timeStr = `${tzInfo.hour.toString().padStart(2, "0")}:${tzInfo.minute.toString().padStart(2, "0")}`
                        const name = job.client.user.name || "Client"
                        
                        const body = settings.smsM7Template
                            .replace(/{name}/g, name)
                            .replace(/{time}/g, timeStr)
                            .replace(/{date}/g, tzInfo.dateStr)

                        await sendSMS(
                            job.clientId,
                            job.client.user.phone,
                            body,
                            job.id
                        )
                    }

                    const newNotes = appendReminderTag(job.notes, "[REMINDER_M7_SENT]")
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { notes: newNotes }
                    })
                    sentSameDay += 1
                } catch (err) {
                    failures.push(`SameDay:${job.id}:${String(err)}`)
                }
            }
        }
    }

    // 2. Retention automation at 9 AM local Montreal time
    const is9AM = montrealNow.hour === 9
    let sentRetention = 0
    if (is9AM) {
        const clients = await prisma.clientProfile.findMany({
            include: {
                user: true,
                jobs: {
                    where: { status: "COMPLETED" },
                    orderBy: { scheduledDate: "desc" },
                    take: 1
                }
            }
        })

        for (const client of clients) {
            const lastJob = client.jobs[0]
            if (!lastJob || !client.user.phone) continue

            const daysDiff = differenceInDays(now, new Date(lastJob.scheduledDate))

            // 1 Month Retention (exactly 30 days)
            if (daysDiff === 30 && settings?.smsRetention30Enabled) {
                try {
                    const sentCount = await prisma.smsMessage.count({
                        where: {
                            clientId: client.id,
                            direction: "OUTBOUND",
                            content: { contains: "1 mois" },
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                        }
                    })

                    if (sentCount === 0) {
                        const name = client.user.name || "Client"
                        const body = settings.smsRetention30Template
                            .replace(/{name}/g, name)

                        await sendSMS(
                            client.id,
                            client.user.phone,
                            body,
                            lastJob.id
                        )
                        sentRetention += 1
                    }
                } catch (err) {
                    failures.push(`Retention1M:${client.id}:${String(err)}`)
                }
            }

            // 2 Months Retention (exactly 60 days)
            if (daysDiff === 60 && settings?.smsRetention60Enabled) {
                try {
                    const sentCount = await prisma.smsMessage.count({
                        where: {
                            clientId: client.id,
                            direction: "OUTBOUND",
                            content: { contains: "2 mois" },
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                        }
                    })

                    if (sentCount === 0) {
                        const name = client.user.name || "Client"
                        const body = settings.smsRetention60Template
                            .replace(/{name}/g, name)

                        await sendSMS(
                            client.id,
                            client.user.phone,
                            body,
                            lastJob.id
                        )
                        sentRetention += 1
                    }
                } catch (err) {
                    failures.push(`Retention2M:${client.id}:${String(err)}`)
                }
            }
        }
    }

    // 3. J-1 (24h) and H-2 (2h) reminders
    const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000)

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

    for (const job of jobs) {
        const deltaMin = Math.floor((new Date(job.scheduledDate).getTime() - now.getTime()) / 60000)

        const shouldSendJ1 = deltaMin >= 1380 && deltaMin <= 1500 && !hasReminderTag(job.notes, TAG_J1)
        const shouldSendH2 = deltaMin >= 110 && deltaMin <= 130 && !hasReminderTag(job.notes, TAG_H2)

        if (!shouldSendJ1 && !shouldSendH2) continue

        try {
            if (shouldSendJ1) {
                await sendReminderNotification(job, "J1")
                
                // Also send SMS if enabled and phone exists
                if (settings?.smsJ1Enabled && job.client?.user?.phone) {
                    const tzInfo = getLocalDateAndHourInTZ(new Date(job.scheduledDate), "America/Montreal")
                    const timeStr = `${tzInfo.hour.toString().padStart(2, "0")}:${tzInfo.minute.toString().padStart(2, "0")}`
                    const dateStr = new Date(job.scheduledDate).toLocaleDateString('fr-CA')
                    const name = job.client.user.name || "Client"
                    
                    const body = settings.smsJ1Template
                        .replace(/{name}/g, name)
                        .replace(/{time}/g, timeStr)
                        .replace(/{date}/g, dateStr)

                    await sendSMS(
                        job.clientId,
                        job.client.user.phone,
                        body,
                        job.id
                    )
                }
                sentJ1 += 1
            }
            if (shouldSendH2) {
                await sendReminderNotification(job, "H2")
                
                // Also send SMS if enabled and phone exists
                if (settings?.smsH2Enabled && job.client?.user?.phone) {
                    const tzInfo = getLocalDateAndHourInTZ(new Date(job.scheduledDate), "America/Montreal")
                    const timeStr = `${tzInfo.hour.toString().padStart(2, "0")}:${tzInfo.minute.toString().padStart(2, "0")}`
                    const dateStr = new Date(job.scheduledDate).toLocaleDateString('fr-CA')
                    const name = job.client.user.name || "Client"
                    
                    const body = settings.smsH2Template
                        .replace(/{name}/g, name)
                        .replace(/{time}/g, timeStr)
                        .replace(/{date}/g, dateStr)

                    await sendSMS(
                        job.clientId,
                        job.client.user.phone,
                        body,
                        job.id
                    )
                }
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
        sentSameDay,
        sentRetention,
        failures,
    }
}
