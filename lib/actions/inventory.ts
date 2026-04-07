"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getInventoryItems() {
    return await prisma.inventoryItem.findMany({
        where: { type: "PRODUCT" },
        orderBy: { name: "asc" }
    })
}

export async function recordProductUsage(data: {
    jobId: string,
    itemId: string,
    quantityUsed: number,
    unit: string
}) {
    try {
        const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } })
        if (!item) return { error: "Produit non trouvé" }

        const usage = await prisma.productUsage.create({
            data: {
                jobId: data.jobId,
                itemId: data.itemId,
                quantityUsed: data.quantityUsed,
                unit: data.unit
            }
        })

        // Decrement stock
        await prisma.inventoryItem.update({
            where: { id: data.itemId },
            data: {
                quantity: { decrement: data.quantityUsed }
            }
        })

        revalidatePath(`/employee/job/${data.jobId}`)
        return { success: true, usage }
    } catch (e) {
        return { error: "Erreur lors de l'enregistrement de la consommation" }
    }
}

export async function getInventory() {
    return await prisma.inventoryItem.findMany({
        include: { formats: true },
        orderBy: { name: "asc" }
    })
}

function parseInventoryCreateInput(
    data: FormData | { name: string; quantity: number; unit: string; minThreshold?: number; type: string; sdsUrl?: string }
) {
    if (data instanceof FormData) {
        const typeRaw = String(data.get("type") ?? "PRODUCT")
        const type =
            typeRaw === "Produit" || typeRaw === "PRODUCT"
                ? "PRODUCT"
                : typeRaw === "Équipement" || typeRaw === "EQUIPMENT"
                  ? "EQUIPMENT"
                  : "PRODUCT"
        const minRaw = data.get("minThreshold")
        return {
            name: String(data.get("name") ?? "").trim(),
            quantity: parseFloat(String(data.get("quantity") ?? "0")) || 0,
            unit: String(data.get("unit") ?? "L"),
            minThreshold: minRaw != null && String(minRaw) !== "" ? parseFloat(String(minRaw)) : 10,
            type,
            sdsUrl: (data.get("sdsUrl") as string) || undefined,
        }
    }
    return data
}

export async function createInventoryItem(
    data: FormData | { name: string; quantity: number; unit: string; minThreshold?: number; type: string; sdsUrl?: string; formats?: any[] }
) {
    try {
        const payload = parseInventoryCreateInput(data)
        // If data has formats (from a complex form), we'll handle it
        const item = await prisma.inventoryItem.create({ 
            data: {
                ...payload,
                // formats handled separately if needed, but for now we'll keep it simple
            } 
        })
        revalidatePath('/admin/inventory')
        return { success: true, item }
    } catch (e) {
        return { error: "Erreur lors de la création du produit" }
    }
}

export async function addInventoryFormat(itemId: string, data: FormData) {
    const label = data.get("label") as string
    const price = parseFloat(data.get("price") as string) || 0
    const quantity = parseFloat(data.get("quantity") as string) || 0

    if (!label) return { error: "Libellé requis (ex: 1L)" }

    try {
        await prisma.inventoryFormat.create({
            data: {
                itemId,
                label,
                price,
                quantity
            }
        })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de l'ajout du format" }
    }
}

export async function deleteInventoryFormat(formatId: string) {
    try {
        await prisma.inventoryFormat.delete({ where: { id: formatId } })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de la suppression du format" }
    }
}

export async function updateInventoryItem(id: string, data: any) {
    try {
        await prisma.inventoryItem.update({ where: { id }, data })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de la mise à jour" }
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        await prisma.inventoryItem.delete({ where: { id } })
        revalidatePath('/admin/inventory')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de la suppression" }
    }
}

export async function getJobProductUsages(jobId: string) {
    try {
        return await prisma.productUsage.findMany({
            where: { jobId },
            include: { item: true },
            orderBy: { createdAt: "desc" }
        })
    } catch (e) {
        console.warn("ProductUsage table missing from DB yet, returning empty")
        return []
    }
}
