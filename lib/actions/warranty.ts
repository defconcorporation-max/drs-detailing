"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export async function issueWarranty(clientId: string, vehicleId: string, serviceId: string, yearsValid: number = 3) {
    try {
        const certNumber = `DRS-${randomBytes(3).toString('hex').toUpperCase()}`
        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + yearsValid)

        const warranty = await prisma.warranty.create({
            data: {
                clientId,
                vehicleId,
                serviceId,
                certNumber,
                expiryDate
            }
        })

        revalidatePath('/client/garage')
        return { success: true, warranty }
    } catch (e) {
        return { error: "Erreur lors de l'émission de la garantie" }
    }
}

export async function getClientWarranties(clientId: string) {
    return await prisma.warranty.findMany({
        where: { clientId },
        include: {
            vehicle: true,
            service: true
        }
    })
}
