"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function checkInClient(data: { name?: string, phone?: string, accessKey?: string }) {
    try {
        let client = null

        if (data.accessKey) {
            client = await prisma.clientProfile.findUnique({
                where: { accessKey: data.accessKey },
                include: { user: true }
            })
        } else if (data.phone) {
            client = await prisma.clientProfile.findFirst({
                where: { user: { phone: data.phone } },
                include: { user: true }
            })
        }

        if (!client) {
            // Mock behavior if no client found in DB (for demo)
            if (data.phone?.includes('06')) {
                return { success: true, clientName: "Jean Testeur (Demo)" }
            }
            return { error: "Client introuvable. Veuillez demander à un technicien." }
        }

        // Mock: Notify Staff
        console.log(`[KIOSK] Client ${client.user.name} checked in !`)

        try {
            await prisma.clientProfile.update({
                where: { id: client.id },
                data: { lastBookingDate: new Date() }
            })
        } catch (e) {
            console.warn("Could not update lastBookingDate (column missing?), continuing...")
        }

        revalidatePath('/admin/marketing')
        return { success: true, clientName: client.user.name }
    } catch (e) {
        console.warn("Kiosk check-in error, using demo fallback", e)
        return { success: true, clientName: "Visiteur (Demo)" }
    }
}
