"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getInventory() {
    const items = await prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' }
    })
    return serialize(items)
}

export async function createInventoryItem(data: FormData) {
    const name = data.get('name') as string
    const quantity = parseFloat(data.get('quantity') as string)
    const unit = data.get('unit') as string
    const type = data.get('type') as string
    const minThreshold = parseFloat(data.get('threshold') as string)

    if (!name) return { error: "Nom requis" }

    try {
        await prisma.inventoryItem.create({
            data: {
                name,
                quantity: quantity || 0,
                unit: unit || 'Unités',
                type: type || 'PRODUCT',
                minThreshold: minThreshold || 5
            }
        })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur création" }
    }
}

export async function updateInventoryItem(id: string, data: FormData) {
    const name = data.get('name') as string
    const quantity = parseFloat(data.get('quantity') as string)
    const unit = data.get('unit') as string
    const minThreshold = parseFloat(data.get('threshold') as string)

    try {
        await prisma.inventoryItem.update({
            where: { id },
            data: {
                name,
                quantity,
                unit,
                minThreshold
            }
        })
        revalidatePath('/admin/inventory')
        revalidatePath('/admin') // refresh dashboard alerts
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour" }
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        await prisma.inventoryItem.delete({ where: { id } })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression" }
    }
}
