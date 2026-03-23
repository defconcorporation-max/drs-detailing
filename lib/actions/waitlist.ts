"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function addToWaitlist(clientId: string, date?: Date) {
    try {
        await prisma.waitlistEntry.create({
            data: {
                clientId,
                preferredDate: date
            }
        })
        revalidatePath('/admin/marketing')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de l'ajout à la file d'attente" }
    }
}

export async function broadcastWaitlistSlot(date: Date) {
    try {
        const entries = await prisma.waitlistEntry.findMany({
            where: { status: "WAITING" },
            include: { client: { include: { user: true } } }
        })

        if (entries.length === 0) return { error: "Personne dans la file d'attente" }

        // Mock: Mass SMS/Notif
        console.log(`[WAITLIST] Broadcasting slot for ${date.toDateString()} to ${entries.length} clients!`)
        
        // Update entries to NOTIFIED
        await prisma.waitlistEntry.updateMany({
            where: { id: { in: entries.map(e => e.id) } },
            data: { status: "NOTIFIED" }
        })

        revalidatePath('/admin/marketing')
        return { success: true, count: entries.length }
    } catch (e) {
        return { error: "Erreur lors de la diffusion" }
    }
}
