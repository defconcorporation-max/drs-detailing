"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getServices() {
    const services = await prisma.service.findMany({
        orderBy: { name: 'asc' }
    })
    return serialize(services)
}

export async function createService(data: FormData) {
    const name = data.get('name') as string
    const description = data.get('description') as string
    const basePrice = parseFloat(data.get('price') as string)
    const durationMin = parseInt(data.get('duration') as string)

    if (!name || isNaN(basePrice)) return { error: "Nom et Prix requis" }

    try {
        await prisma.service.create({
            data: {
                name,
                description,
                basePrice,
                durationMin: durationMin || 60
            }
        })
        revalidatePath('/admin/services')
        return { success: true }
    } catch (e) {
        return { error: "Erreur création" }
    }
}

export async function updateService(id: string, data: FormData) {
    const name = data.get('name') as string
    const description = data.get('description') as string
    const basePrice = parseFloat(data.get('price') as string)
    const durationMin = parseInt(data.get('duration') as string)

    try {
        await prisma.service.update({
            where: { id },
            data: {
                name,
                description,
                basePrice,
                durationMin
            }
        })
        revalidatePath('/admin/services')
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour" }
    }
}

export async function deleteService(id: string) {
    try {
        await prisma.service.delete({ where: { id } })
        revalidatePath('/admin/services')
        return { success: true }
    } catch (e) {
        return { error: "Impossible de supprimer (Probablement lié à des jobs existants)" }
    }
}
