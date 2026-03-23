"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Triggered when a job is marked as "COMPLETED".
 * In a real app, this would send an email via Resend or an SMS via Twilio.
 */
export async function triggerNpsAutomation(jobId: string) {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { client: { include: { user: true } } }
    })

    if (!job || !job.client.user.email) return { error: "Job ou email client introuvable" }

    try {
        // Simulation d'envoi d'email
        console.log(`[DRS AUTOMATION] Sending NPS email to ${job.client.user.email} for job ${jobId}`)
        
        // On pourrait enregistrer qu'on a envoyé le NPS
        await prisma.clientProfile.update({
            where: { id: job.clientId },
            data: { 
                // Suggestion: ajouter un champ lastNpsSent au modèle ClientProfile
                // Pour l'instant, on se contente de la simulation
            }
        })

        return { success: true }
    } catch (e) {
        return { error: "Erreur lors du déclenchement NPS" }
    }
}

/**
 * Logic to handle receipt of an NPS score from a client.
 * If score > 8, we provide a link to Google Reviews.
 */
export async function recordNpsScore(clientId: string, score: number) {
    try {
        // Enregistrement du score (nécessite le champ npsScore dans le schéma)
        // simulation pour le moment
        return { 
            success: true, 
            askForGoogleReview: score >= 9 
        }
    } catch (e) {
        return { error: "Erreur enregistrement score" }
    }
}
