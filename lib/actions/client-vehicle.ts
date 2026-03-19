"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function addVehicle(token: string, data: FormData) {
    const type = data.get('type') as string
    const make = data.get('make') as string
    const model = data.get('model') as string
    const year = data.get('year') as string
    const plate = data.get('licensePlate') as string

    if (!make || !model) return { error: "Marque et Modèle requis" }

    try {
        const client = await prisma.clientProfile.findUnique({ where: { accessKey: token } })
        if (!client) return { error: "Client introuvable" }

        await prisma.vehicle.create({
            data: {
                clientId: client.id,
                type: type || "OTHER",
                make,
                model,
                year: year ? parseInt(year) : undefined,
                licensePlate: plate || null
            }
        })
        revalidatePath(`/client/${token}`)
        return { success: true }
    } catch (e) {
        return { error: "Erreur ajout véhicule" }
    }
}

export async function deleteVehicle(token: string, vehicleId: string) {
    try {
        // Validation ownership
        const client = await prisma.clientProfile.findUnique({ where: { accessKey: token } })
        if (!client) return { error: "Auth Error" }

        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
        if (!vehicle || vehicle.clientId !== client.id) return { error: "Véhicule introuvable" }

        await prisma.vehicle.delete({ where: { id: vehicleId } })
        revalidatePath(`/client/${token}`)
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression" }
    }
}
