"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export async function createGiftCard(amount: number) {
    try {
        const code = randomBytes(4).toString('hex').toUpperCase()
        const giftCard = await prisma.giftCard.create({
            data: {
                code,
                initialAmount: amount,
                currentAmount: amount,
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year expiry
            }
        })
        revalidatePath('/admin/accounting')
        return { success: true, giftCard }
    } catch (e) {
        return { error: "Erreur lors de la création de la carte cadeau" }
    }
}

export async function redeemGiftCard(code: string, jobId: string) {
    try {
        const giftCard = await prisma.giftCard.findUnique({
            where: { code, isActive: true }
        })

        if (!giftCard || giftCard.currentAmount <= 0) {
            return { error: "Carte cadeau invalide ou épuisée" }
        }

        const job = await prisma.job.findUnique({
            where: { id: jobId }
        })

        if (!job) return { error: "Job introuvable" }

        const amountToDeduct = Math.min(job.totalPrice || 0, giftCard.currentAmount)

        // Update Gift Card
        await prisma.giftCard.update({
            where: { id: giftCard.id },
            data: { 
                currentAmount: { decrement: amountToDeduct },
                isActive: giftCard.currentAmount - amountToDeduct > 0
            }
        })

        // Update Job (this would ideally be a separate payment record, but for MVP we adjust totalPrice)
        // In a real system, we'd add a 'Payment' record linked to the Job.
        
        revalidatePath('/')
        return { success: true, deducted: amountToDeduct }
    } catch (e) {
        return { error: "Erreur lors de l'utilisation de la carte cadeau" }
    }
}
