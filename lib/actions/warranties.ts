"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getWarranties() {
    try {
        const warranties = await prisma.warranty.findMany({
            include: {
                client: { include: { user: true } },
                vehicle: true,
                service: true
            },
            orderBy: { issueDate: 'desc' }
        })
        return serialize(warranties)
    } catch (e) {
        console.warn("Warranties fetch failed (table missing?), using empty list", e)
        return []
    }
}

export async function createWarranty(data: FormData) {
    const clientId = data.get('clientId') as string
    const vehicleId = data.get('vehicleId') as string
    const serviceId = data.get('serviceId') as string
    const years = parseInt(data.get('years') as string) || 1

    if (!clientId || !vehicleId || !serviceId) return { error: "Données manquantes" }

    try {
        const certNumber = `DRS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`
        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + years)

        await prisma.warranty.create({
            data: {
                clientId,
                vehicleId,
                serviceId,
                certNumber,
                expiryDate,
                status: 'ACTIVE'
            }
        })

        revalidatePath('/admin/warranties')
        return { success: true, certNumber }
    } catch (e) {
        console.error("Warranty creation error", e)
        return { error: "Erreur lors de l'émission du certificat" }
    }
}

export async function deleteWarranty(id: string) {
    try {
        await prisma.warranty.delete({ where: { id } })
        revalidatePath('/admin/warranties')
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression" }
    }
}
