"use server"

import { twilioClient, twilioPhone } from "@/lib/twilio"
import prisma from "@/lib/db"
import { getLocalDateAndHourInTZ } from "@/lib/date-local"

export async function sendSMS(clientId: string, phone: string, content: string, jobId?: string) {
    if (!twilioClient || !twilioPhone) {
        return { error: "L'intégration Twilio n'est pas configurée. Vérifiez vos variables d'environnement." }
    }
    
    if (!phone) {
        return { error: "Numéro de téléphone manquant." }
    }

    // Normalize phone number to E.164 (+1XXXXXXXXXX for CA/US)
    let formattedPhone = phone.trim()
    const digits = formattedPhone.replace(/\D/g, "")
    if (digits.length === 10) {
        formattedPhone = `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith("1")) {
        formattedPhone = `+${digits}`
    } else if (formattedPhone.startsWith("+")) {
        formattedPhone = `+${digits}`
    } else {
        formattedPhone = `+${digits}`
    }

    try {
        // Envoi du message via Twilio
        const message = await twilioClient.messages.create({
            body: content,
            from: twilioPhone,
            to: formattedPhone,
        })

        // Enregistrement dans la DB
        await prisma.smsMessage.create({
            data: {
                clientId,
                jobId: jobId || null,
                direction: "OUTBOUND",
                content,
                status: "SENT",
                twilioSid: message.sid
            }
        })

        return { success: true }
    } catch (error: any) {
        console.error("Erreur Twilio:", error)
        
        // Enregistrement de l'échec
        await prisma.smsMessage.create({
            data: {
                clientId,
                jobId: jobId || null,
                direction: "OUTBOUND",
                content,
                status: "FAILED"
            }
        })
        
        return { error: error.message || "Erreur lors de l'envoi du SMS." }
    }
}

export async function getSmsHistory(clientId: string) {
    try {
        const messages = await prisma.smsMessage.findMany({
            where: { clientId },
            orderBy: { createdAt: 'asc' }
        })
        return { success: true, messages }
    } catch (error) {
        return { error: "Impossible de récupérer l'historique des SMS." }
    }
}

export async function getSmsConversations() {
    try {
        const clients = await prisma.clientProfile.findMany({
            include: {
                user: true,
                smsMessages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        const conversations = clients.map(client => {
            const lastMsg = client.smsMessages[0]
            return {
                clientId: client.id,
                clientName: client.user.name || "Client sans nom",
                clientPhone: client.user.phone || "",
                lastMessage: lastMsg ? lastMsg.content : "Pas d'historique de messages",
                lastMessageDate: lastMsg ? lastMsg.createdAt : new Date(0),
                direction: lastMsg ? lastMsg.direction : null,
                status: lastMsg ? lastMsg.status : null
            }
        })

        // Sort: those with messages first (by date desc), then alphabetical
        conversations.sort((a, b) => {
            const dateA = a.lastMessageDate.getTime()
            const dateB = b.lastMessageDate.getTime()
            if (dateA !== dateB) return dateB - dateA
            return a.clientName.localeCompare(b.clientName)
        })

        return { success: true, conversations }
    } catch (e) {
        console.error("Error fetching SMS conversations:", e)
        return { error: "Impossible de récupérer les conversations." }
    }
}

export async function sendBookingConfirmationSMS(jobId: string) {
    try {
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { client: { include: { user: true } } }
        })

        if (!job || !job.client?.user?.phone) {
            console.log("sendBookingConfirmationSMS: Job or client phone number not found", jobId)
            return { error: "Job ou téléphone client manquant" }
        }

        const settings = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
        if (!settings || !settings.smsConfirmEnabled) {
            console.log("sendBookingConfirmationSMS: SMS confirmation is disabled or settings not found")
            return { error: "Automatisations SMS désactivées" }
        }

        const tzInfo = getLocalDateAndHourInTZ(new Date(job.scheduledDate), "America/Montreal")
        const timeStr = `${tzInfo.hour.toString().padStart(2, "0")}:${tzInfo.minute.toString().padStart(2, "0")}`
        const dateStr = new Date(job.scheduledDate).toLocaleDateString('fr-CA')
        
        const name = job.client.user.name || "Client"
        const body = settings.smsConfirmTemplate
            .replace(/{name}/g, name)
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)

        console.log(`Sending booking confirmation SMS to ${job.client.user.phone} (${formattedPhone(job.client.user.phone)}): "${body}"`)

        const res = await sendSMS(
            job.clientId,
            job.client.user.phone,
            body,
            job.id
        )

        return res
    } catch (error) {
        console.error("Error in sendBookingConfirmationSMS:", error)
        return { error: "Erreur interne" }
    }
}

function formattedPhone(phone: string) {
    const digits = phone.replace(/\D/g, "")
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
    return phone.startsWith("+") ? `+${digits}` : `+${digits}`
}
