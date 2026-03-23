"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getClientReferralData(clientProfileId: string) {
    return await prisma.clientProfile.findUnique({
        where: { id: clientProfileId },
        select: {
            referralCode: true,
            loyaltyPoints: true,
            _count: {
                select: { referrals: true }
            }
        }
    })
}

export async function submitReferral(newClientId: string, code: string) {
    try {
        // Find referrer
        const referrer = await prisma.clientProfile.findUnique({
            where: { referralCode: code }
        })

        if (!referrer) return { error: "Code de parrainage invalide" }
        if (referrer.id === newClientId) return { error: "Vous ne pouvez pas vous parrainer vous-même" }

        // Update new client
        await prisma.clientProfile.update({
            where: { id: newClientId },
            data: { 
                referredById: referrer.id,
                loyaltyPoints: { increment: 50 } // New client gets 50 points
            }
        })

        // Reward referrer
        await prisma.clientProfile.update({
            where: { id: referrer.id },
            data: { 
                loyaltyPoints: { increment: 100 } // Referrer gets 100 points
            }
        })

        revalidatePath('/')
        return { success: true, message: "Parrainage appliqué ! Vous avez reçu 50 points." }
    } catch (e) {
        return { error: "Erreur lors du parrainage" }
    }
}
