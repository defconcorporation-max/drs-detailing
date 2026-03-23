"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getGiftCards() {
    try {
        const cards = await prisma.giftCard.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return serialize(cards)
    } catch (e) {
        console.warn("GiftCards fetch failed, using empty", e)
        return []
    }
}

export async function createGiftCard(data: FormData) {
    const amount = parseFloat(data.get('amount') as string)
    const code = data.get('code') as string || `GIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    if (!amount || amount <= 0) return { error: "Montant invalide" }

    try {
        await prisma.giftCard.create({
            data: {
                code,
                initialAmount: amount,
                currentAmount: amount,
                isActive: true
            }
        })
        revalidatePath('/admin/accounting')
        return { success: true, code }
    } catch (e) {
        return { error: "Erreur création carte cadeau" }
    }
}

export async function validateGiftCard(code: string) {
    try {
        const card = await prisma.giftCard.findUnique({
            where: { code, isActive: true }
        })

        if (!card) return { error: "Code invalide ou expiré" }
        if (card.currentAmount <= 0) return { error: "Carte vide" }

        return { success: true, card: serialize(card) }
    } catch (e) {
        return { error: "Erreur validation" }
    }
}
