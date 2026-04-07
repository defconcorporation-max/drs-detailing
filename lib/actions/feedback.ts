"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { serialize } from "@/lib/utils"

export async function submitFeedback(formData: FormData) {
    const content = formData.get('content') as string
    const pageUrl = formData.get('pageUrl') as string
    const userContext = formData.get('userContext') as string
    const screenshotsJson = formData.get('screenshots') as string // Expected to be stringified JSON of base64 strings

    if (!content) return { error: "Le contenu est requis" }

    try {
        let screenshots = null
        if (screenshotsJson) {
            try {
                screenshots = JSON.parse(screenshotsJson)
            } catch (e) {
                console.error("Failed to parse screenshots JSON", e)
            }
        }

        await prisma.betaFeedback.create({
            data: {
                content,
                pageUrl: pageUrl || 'N/A',
                userContext,
                screenshots,
                status: 'OPEN'
            }
        })

        revalidatePath('/admin/feedbacks')
        return { success: true }
    } catch (error) {
        console.error("Feedback submit error:", error)
        return { error: "Erreur lors de l'envoi du feedback" }
    }
}

export async function getFeedbacks() {
    try {
        const feedbacks = await prisma.betaFeedback.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return serialize(feedbacks)
    } catch (error) {
        console.error("Fetch feedbacks error:", error)
        return []
    }
}

export async function updateFeedbackStatus(id: string, status: string) {
    try {
        await prisma.betaFeedback.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/admin/feedbacks')
        return { success: true }
    } catch (error) {
        return { error: "Erreur de mise à jour" }
    }
}

export async function deleteFeedback(id: string) {
    try {
        await prisma.betaFeedback.delete({
            where: { id }
        })
        revalidatePath('/admin/feedbacks')
        return { success: true }
    } catch (error) {
        return { error: "Erreur de suppression" }
    }
}
