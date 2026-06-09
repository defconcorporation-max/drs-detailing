"use server"

import { twilioClient, twilioPhone } from "@/lib/twilio"
import prisma from "@/lib/db"

export async function sendSMS(clientId: string, phone: string, content: string, jobId?: string) {
    if (!twilioClient || !twilioPhone) {
        return { error: "L'intégration Twilio n'est pas configurée. Vérifiez vos variables d'environnement." }
    }
    
    if (!phone) {
        return { error: "Numéro de téléphone manquant." }
    }

    try {
        // Envoi du message via Twilio
        const message = await twilioClient.messages.create({
            body: content,
            from: twilioPhone,
            to: phone,
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
